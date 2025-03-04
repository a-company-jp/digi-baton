function base64UrlToArrayBuffer(base64UrlData) {
  const base64 = base64UrlData.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (base64.length % 4);
  const padded = pad !== 4 ? base64 + '='.repeat(pad) : base64;
  const raw = atob(padded);
  const outputArray = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    outputArray[i] = raw.charCodeAt(i);
  }
  return outputArray.buffer;
}

function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64;
}

// --------------------------------
// Register flow
async function registerBegin() {
  const username = document.getElementById('reg-username').value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }

  // 1. Get challenge from server
  const resp = await fetch(`http://localhost:8081/register/begin?username=${encodeURIComponent(username)}`);
  if (!resp.ok) {
    alert('Failed to begin registration');
    return;
  }
  const options = await resp.json();

  // 2. Convert Base64URL fields to ArrayBuffer
  if (options.publicKey) {
    if (options.publicKey.challenge) {
      options.publicKey.challenge = base64UrlToArrayBuffer(options.publicKey.challenge);
    }
    if (options.publicKey.user && options.publicKey.user.id) {
      options.publicKey.user.id = base64UrlToArrayBuffer(options.publicKey.user.id);
    }
    if (options.publicKey.excludeCredentials) {
      for (let cred of options.publicKey.excludeCredentials) {
        cred.id = base64UrlToArrayBuffer(cred.id);
      }
    }
  }

  // 3. navigator.credentials.create()
  let credential;
  try {
    credential = await navigator.credentials.create({ publicKey: options.publicKey });
  } catch (err) {
    console.error('Error creating credential:', err);
    alert('Error creating credential: ' + err);
    return;
  }

  // 4. Send credential to server
  const credentialJSON = {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON),
    },
  };

  const finishResp = await fetch(`http://localhost:8081/register/finish?username=${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentialJSON),
  });
  const finishData = await finishResp.json();
  alert('Finish Registration => ' + JSON.stringify(finishData));
}

// --------------------------------
// Login flow
async function loginBegin() {
  const username = document.getElementById('login-username').value.trim();
  if (!username) {
    alert('Please enter a username');
    return;
  }

  // 1. Get challenge from server
  const resp = await fetch(`http://localhost:8081/login/begin?username=${encodeURIComponent(username)}`);
  if (!resp.ok) {
    alert('Failed to begin login');
    return;
  }
  const options = await resp.json();

  // 2. Convert Base64URL fields to ArrayBuffer
  if (options.publicKey) {
    if (options.publicKey.challenge) {
      options.publicKey.challenge = base64UrlToArrayBuffer(options.publicKey.challenge);
    }
    if (options.publicKey.allowCredentials) {
      for (let cred of options.publicKey.allowCredentials) {
        cred.id = base64UrlToArrayBuffer(cred.id);
      }
    }
  }

  // 3. navigator.credentials.get()
  let assertion;
  try {
    assertion = await navigator.credentials.get({ publicKey: options.publicKey });
  } catch (err) {
    console.error('Error get credentials:', err);
    alert('Error get credentials: ' + err);
    return;
  }

  // 4. Send assertion to server
  const assertionJSON = {
    id: assertion.id,
    rawId: arrayBufferToBase64Url(assertion.rawId),
    type: assertion.type,
    response: {
      authenticatorData: arrayBufferToBase64Url(assertion.response.authenticatorData),
      clientDataJSON: arrayBufferToBase64Url(assertion.response.clientDataJSON),
      signature: arrayBufferToBase64Url(assertion.response.signature),
      userHandle: assertion.response.userHandle ? arrayBufferToBase64Url(assertion.response.userHandle) : null,
    },
  };

  const finishResp = await fetch(`http://localhost:8081/login/finish?username=${encodeURIComponent(username)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(assertionJSON),
  });

  const finishData = await finishResp.json();
  alert('Finish Login => ' + JSON.stringify(finishData));
}
