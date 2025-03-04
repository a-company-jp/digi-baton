console.log('[Extension] Service Worker loaded');

// 1. Attach to WebAuthn requests
chrome.webAuthenticationProxy.attach(() => {
  console.log('[Extension] Attached to WebAuthn');
});

let isAttached = false;

interface CredentialInfo {
  id: string;             // Base64
  userId: string | null; // Base64
  signCount: number;
}

const credentialsStore: Record<string, CredentialInfo[]> = {};

/**
 * Converts an ArrayBuffer or TypedArray to a Base64 (not URL-safe) string.
 * The Chrome extension's WebAuthn flow generally handles standard Base64 internally.
 */
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Generates a minimal, valid CBOR attestationObject for "none" attestation.
 * This is purely synthetic and not cryptographically valid. It's enough to satisfy
 * the Chrome extension's validation checks for demonstration purposes.
 */
function generateDummyAttestationObject() {
  // A minimal CBOR object with fields: { fmt: "none", authData: <4 dummy bytes>, attStmt: {} }
  // Hex breakdown:
  //   a3                                      # map(3)
  //      63 66 6d 74                          # text(3) "fmt"
  //      64 6e 6f 6e 65                       # text(4) "none"
  //      68 61 75 74 68 44 61 74 61           # text(8) "authData"
  //      44 01 01 01 01                       # bytes(4) 0x01 0x01 0x01 0x01
  //      67 61 74 74 53 74 6d 74              # text(7) "attStmt"
  //      a0                                   # map(0) {}
  const cborBytes = new Uint8Array([
    0xa3,
    0x63, 0x66, 0x6d, 0x74,
    0x64, 0x6e, 0x6f, 0x6e, 0x65,
    0x68, 0x61, 0x75, 0x74, 0x68, 0x44, 0x61, 0x74, 0x61,
    0x44, 0x01, 0x01, 0x01, 0x01,
    0x67, 0x61, 0x74, 0x74, 0x53, 0x74, 0x6d, 0x74,
    0xa0
  ]);
  return bufferToBase64(cborBytes.buffer);
}

/**
 * Generates dummy clientDataJSON in Base64 form.
 * Real authenticators fill this with the challenge, origin, type, etc.
 */
function generateDummyClientDataJSON(type: 'create' | 'get'): string {
  const clientData = {
    type: `webauthn.${type}`, // e.g., "webauthn.create" or "webauthn.get"
    challenge: 'dummy-challenge',
    origin: 'https://example.com'
  };
  return btoa(JSON.stringify(clientData));
}

// Listen for messages to attach/detach from the WebAuthn requests
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'register' || message.action === 'authenticate') {
    if (!isAttached) {
      chrome.webAuthenticationProxy.attach()
        .then(() => {
          isAttached = true;
          console.log('WebAuthn proxy attached.');
          sendResponse({status: 'ready'});
        })
        .catch(err => {
          console.error('Error attaching WebAuthn proxy:', err);
          sendResponse({status: 'error', message: err.message});
        });
      return true; // Keep the messaging channel open for async
    } else {
      // Already attached
      sendResponse({status: 'ready'});
    }
  } else if (message.action === 'stop') {
    if (isAttached) {
      chrome.webAuthenticationProxy.detach()
        .then(() => {
          isAttached = false;
          console.log('WebAuthn proxy detached.');
          sendResponse({status: 'detached'});
        })
        .catch(err => {
          console.error('Error detaching WebAuthn proxy:', err);
          sendResponse({status: 'error', message: err.message});
        });
      return true;
    } else {
      sendResponse({status: 'detached'});
    }
  }
  return false;
});

// Handle registration (navigator.credentials.create)
chrome.webAuthenticationProxy.onCreateRequest.addListener(async (requestInfo) => {
  console.log('WebAuthn onCreateRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;

  try {
    // fetch POST localhost:8003/create-key
    // body should be requestInfo
    const resp = await fetch('http://localhost:8083/create-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestInfo),
    })
    // get body of response as json
    const body = await resp.text()
    console.log('Response from create-key:', body);
    await chrome.webAuthenticationProxy.completeCreateRequest({
      requestId,
      responseJson: body
    });
    console.log('completeCreateRequest sent for requestId:', requestId);

  } catch (error) {
    console.error('Registration error:', error);
    // Report error back
    await chrome.webAuthenticationProxy.completeCreateRequest({
      requestId,
      error: {name: 'NotAllowedError', message: 'Registration failed'}
    });
  }
});

// Handle authentication (navigator.credentials.get)
chrome.webAuthenticationProxy.onGetRequest.addListener(async (requestInfo) => {
  console.log('WebAuthn onGetRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;

  try {
    const options = JSON.parse(requestDetailsJson);
    const publicKeyOptions = options.publicKey || options;
    const rpId = publicKeyOptions.rpId || '';
    const allowCredentials = publicKeyOptions.allowCredentials || [];

    // Find a matching credential
    let usedCred = null;
    if (allowCredentials.length > 0) {
      for (let cred of allowCredentials) {
        const credId = typeof cred.id === 'string'
          ? cred.id
          : bufferToBase64(cred.id);

        if (rpId && credentialsStore[rpId]) {
          usedCred = credentialsStore[rpId].find(c => c.id === credId);
        } else {
          // If rpId not specified, search all
          for (const rp in credentialsStore) {
            usedCred = credentialsStore[rp].find(c => c.id === credId);
            if (usedCred) break;
          }
        }
        if (usedCred) break;
      }
    } else {
      // No credential specified, use first from that rpId
      if (rpId && credentialsStore[rpId] && credentialsStore[rpId].length > 0) {
        usedCred = credentialsStore[rpId][0];
      }
    }

    if (!usedCred) {
      throw new Error('No matching credential found for authentication.');
    }

    // Increment sign count
    usedCred.signCount = (usedCred.signCount || 0) + 1;

    // Construct a dummy clientDataJSON
    const dummyClientData = generateDummyClientDataJSON('get');
    // We'll reuse the same minimal approach: 4 dummy bytes in the "authData" field.
    const dummyAuthenticatorData = bufferToBase64(new Uint8Array([1, 1, 1, 2]).buffer);

    // Build the authentication assertion
    const assertionResponse = {
      type: 'public-key',
      id: usedCred.id,
      rawId: usedCred.id,
      response: {
        clientDataJSON: dummyClientData,
        authenticatorData: dummyAuthenticatorData,
        signature: '', // In a real scenario, you'd sign with the private key
        userHandle: usedCred.userId || ''
      }
    };

    // Send the authentication response
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      responseJson: JSON.stringify(assertionResponse)
    });
    console.log('completeGetRequest sent for requestId:', requestId);

  } catch (error) {
    console.error('Authentication error:', error);
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      error: {name: 'NotAllowedError', message: 'Authentication failed'}
    });
  }
});
// Handle cancellation of WebAuthn requests
// chrome.webAuthenticationProxy.onRequestCanceled.addListener(({ requestId }) => {
//   console.warn('WebAuthn request canceled:', requestId);
// });

// Replace (or add) the existing bufferToBase64 helper with a bufferToBase64Url helper.
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // Standard Base64
  let base64String = btoa(binary);
  // Convert to Base64URL
  return base64String
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
