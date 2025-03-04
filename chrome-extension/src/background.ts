// background.ts - Chrome Extension Background Script for WebAuthn Proxy (TypeScript)

// 1) まず、webAuthenticationProxy に必要な型定義を独自追加する
//    （@types/chrome には存在しないため。以下は最低限のサンプル例です。）

interface WebAuthenticationProxyAttachCallback {
  (): void;
}

/** 登録(create)要求が来た際の情報 */
interface CreateRequestInfo {
  requestId: string;
  requestDetailsJson: string;
}

/** 認証(get)要求が来た際の情報 */
interface GetRequestInfo {
  requestId: string;
  requestDetailsJson: string;
}

interface CompleteCreateRequestParams {
  requestId: string;
  responseJson?: string;
  error?: {
    name: string;
    message: string;
  };
}

interface CompleteGetRequestParams {
  requestId: string;
  responseJson?: string;
  error?: {
    name: string;
    message: string;
  };
}

const webAuthn = chrome.webAuthenticationProxy;

// ------------------------------------------------------------------------------------------------
// 2) 以下、元のJavaScriptコードを TypeScript へ書き換え
// ------------------------------------------------------------------------------------------------

console.log('[Extension] Service Worker loaded');

// 1. Attach to WebAuthn requests
//   - attach() の結果が Promise で返る想定なので "await" してもよいが、
//     コールバックを使う場合は下記のようにしてもOK
webAuthn.attach(() => {
  console.log('[Extension] Attached to WebAuthn');
});

let isAttached = false;

// Simple in-memory credential storage (map of rpId -> array of credentials)
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
 */
function generateDummyAttestationObject(): string {
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

// メッセージの action を扱うための型
interface Message {
  action?: 'register' | 'authenticate' | 'stop';

  [key: string]: any;
}

// Listen for messages to attach/detach from the WebAuthn requests
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  if (message.action === 'register' || message.action === 'authenticate') {
    if (!isAttached) {
      webAuthn.attach()
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
      webAuthn.detach()
        .then(() => {
          isAttached = false;
          console.log('WebAuthn proxy detached.');
          sendResponse({status: 'detached'});
        })
        .catch(err => {
          console.error('Error detaching WebAuthn proxy:', err);
          sendResponse({status: 'error', message: err.message});
        });
      return true; // Keep the messaging channel open for async
    } else {
      sendResponse({status: 'detached'});
    }
  }
  return false;
});

// Handle registration (navigator.credentials.create)
webAuthn.onCreateRequest.addListener(async (requestInfo: CreateRequestInfo) => {
  console.log('WebAuthn onCreateRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;

  try {
    const options = JSON.parse(requestDetailsJson);
    const publicKeyOptions = options.publicKey || options;
    const rpId = publicKeyOptions.rp && publicKeyOptions.rp.id
      ? publicKeyOptions.rp.id
      : (publicKeyOptions.rp ? publicKeyOptions.rp.name : 'unknown-rp');

    const user = publicKeyOptions.user || {};

    // Generate a new credential ID
    const newId = new Uint8Array(16);
    crypto.getRandomValues(newId);
    const credentialId = bufferToBase64(newId);

    // Store in our in-memory store
    if (!credentialsStore[rpId]) {
      credentialsStore[rpId] = [];
    }
    credentialsStore[rpId].push({
      id: credentialId,
      userId: user.id ? bufferToBase64(user.id) : null,
      signCount: 0
    });

    const credentialIdUrl = bufferToBase64Url(newId);

    // Construct a minimal, valid attestationObject
    const dummyAttestation = generateDummyAttestationObject();
    // Construct a dummy clientDataJSON
    const dummyClientData = generateDummyClientDataJSON('create');

    // Build a valid registration (PublicKeyCredential) response object
    const credentialResponse = {
      type: 'public-key',
      id: credentialIdUrl,
      rawId: credentialIdUrl, // Typically base64url in real usage
      response: {
        clientDataJSON: dummyClientData,
        attestationObject: dummyAttestation
      }
    };

    // Send the registration response
    await webAuthn.completeCreateRequest({
      requestId,
      responseJson: JSON.stringify(credentialResponse)
    });
    console.log('completeCreateRequest sent for requestId:', requestId);

  } catch (error: any) {
    console.error('Registration error:', error);
    // Report error back
    await webAuthn.completeCreateRequest({
      requestId,
      error: {name: 'NotAllowedError', message: error.message || 'Registration failed'}
    });
  }
});

// Handle authentication (navigator.credentials.get)
webAuthn.onGetRequest.addListener(async (requestInfo: GetRequestInfo) => {
  console.log('WebAuthn onGetRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;

  try {
    const options = JSON.parse(requestDetailsJson);
    const publicKeyOptions = options.publicKey || options;
    const rpId: string = publicKeyOptions.rpId || '';
    const allowCredentials = publicKeyOptions.allowCredentials || [];

    // Find a matching credential
    let usedCred: CredentialInfo | undefined;

    if (allowCredentials.length > 0) {
      for (const cred of allowCredentials) {
        // cred.id が string で来ることも ArrayBuffer で来ることもある
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
    await webAuthn.completeGetRequest({
      requestId,
      responseJson: JSON.stringify(assertionResponse)
    });
    console.log('completeGetRequest sent for requestId:', requestId);

  } catch (error: any) {
    console.error('Authentication error:', error);
    await webAuthn.completeGetRequest({
      requestId,
      error: {name: 'NotAllowedError', message: error.message || 'Authentication failed'}
    });
  }
});

// Handle cancellation of WebAuthn requests
webAuthn.onRequestCanceled.addListener(({requestId}) => {
  console.warn('WebAuthn request canceled:', requestId);
});

/**
 * Replace (or add) the existing bufferToBase64 helper with a bufferToBase64Url helper.
 */
function bufferToBase64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer);
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
