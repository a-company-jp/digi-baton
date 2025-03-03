// background.js
// Manifest V3 service worker
// Chrome拡張が WebAuthn認証リクエストを受け取り、バックエンド(ポート8083)で代理署名するサンプルコード

console.log('[Extension] Service Worker loaded');

// 1. Attach to WebAuthn requests
chrome.webAuthenticationProxy.attach(() => {
  console.log('[Extension] Attached to WebAuthn');
});

// 2. Listen for navigator.credentials.get() calls
chrome.webAuthenticationProxy.onGetRequest.addListener(async (request) => {
  console.log('[Extension] onGetRequest:', request);
    const { requestId, requestDetailsJson } = request;

  // requestDetailsJson is a JSON string representing PublicKeyCredentialRequestOptions
  // We'll parse it to extract rpId, challenge, etc.

  let options;
  try {
    options = JSON.parse(requestDetailsJson);
  } catch (err) {
    console.error('[Extension] Failed to parse requestDetailsJson:', err);
    // If parse fails, we can either complete with error or cancel.
    // For simplicity, just return an empty credential.
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      responseError: 'invalid_request',
    });
    return;
  }

  // We typically find the challenge as base64(or base64url) in options.challenge.
  // But format can vary. Let's assume base64url.
  const base64Challenge = arrayBufferToBase64Url(options.challenge);

  // rpId typically in options.rpId
  const rpId = options.rpId || 'localhost';

  // We'll also assume a single credential allowed or we have some known credentialId.
  // For PoC, let's take the first from allowCredentials if present.
  let credentialId = 'demo-cred-id';
  if (options.allowCredentials && options.allowCredentials.length > 0) {
    const allowCred = options.allowCredentials[0];
    credentialId = arrayBufferToBase64Url(allowCred.id);
  }

  // For demonstration, assume username is known or mapped by the extension.
  // You might have a local DB in the extension or some logic to pick the user.
  // We'll just use a hard-coded 'alice'.
  const username = 'alice';

  // 3. Call the backend at http://localhost:8083/sign-assertion
  // Provide rpId, challenge, credentialId, and username.

  const bodyData = {
    username,
    credentialId,
    rpId,
    challenge: base64Challenge,
  };

  console.log('[Extension] Sending sign-assertion request to backend:', bodyData);

  try {
    const resp = await fetch('http://localhost:8083/sign-assertion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    });

    if (!resp.ok) {
      console.error('[Extension] sign-assertion backend error:', resp.status);
      await chrome.webAuthenticationProxy.completeGetRequest({
        requestId,
        responseError: 'invalid_request'
      });
      return;
    }

    const credential = await resp.json();
    console.log('[Extension] Received credential from backend:', credential);

    // 4. Return this credential as the WebAuthn response
    // We'll pass it to completeGetRequest as a JSON string.

    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      responseJson: JSON.stringify(credential)
    });

    console.log('[Extension] Completed getRequest with backend-provided credential');
  } catch (err) {
    console.error('[Extension] sign-assertion request failed:', err);
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      responseError: 'unknown_error'
    });
  }
});

// 5. On request canceled
chrome.webAuthenticationProxy.onRequestCanceled.addListener((req) => {
  console.log('[Extension] onRequestCanceled:', req);
});


// Helper function: convert ArrayBuffer to base64url
function arrayBufferToBase64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64;
}
