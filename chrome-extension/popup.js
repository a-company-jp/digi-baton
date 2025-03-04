// popup.js

async function registerPasskey(username) {
  try {
    // 1) /register/begin に問い合わせ -> WebAuthn登録オプション(JSON)を取得
    const beginResp = await fetch(`http://localhost:8080/register/begin?username=${encodeURIComponent(username)}`);
    if (!beginResp.ok) {
      throw new Error(`Begin registration failed: ${beginResp.status}`);
    }
    const options = await beginResp.json();

    // 2) 受け取ったオプションに含まれるBase64URLのバイナリをArrayBufferに復元
    //    - 例: options.publicKey.challenge, user.id, excludeCredentials[].id など
    options.publicKey.challenge = base64UrlToArrayBuffer(options.publicKey.challenge);
    if (options.publicKey.user && options.publicKey.user.id) {
      options.publicKey.user.id = base64UrlToArrayBuffer(options.publicKey.user.id);
    }
    if (options.publicKey.excludeCredentials) {
      options.publicKey.excludeCredentials = options.publicKey.excludeCredentials.map((cred) => {
        cred.id = base64UrlToArrayBuffer(cred.id);
        return cred;
      });
    }

    // 3) navigator.credentials.create() で認証器(プラットフォーム or セキュリティキー)を呼び出し
    const credential = await navigator.credentials.create({publicKey: options.publicKey});
    if (!credential) {
      throw new Error('No credential returned from authenticator.');
    }

    // 4) 登録完了用エンドポイントにパスキー情報を送信
    const credentialJSON = {
      id: credential.id,
      rawId: arrayBufferToBase64Url(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: arrayBufferToBase64Url(credential.response.attestationObject),
        clientDataJSON: arrayBufferToBase64Url(credential.response.clientDataJSON)
      }
    };
    const finishResp = await fetch(`http://localhost:8080/register/finish?username=${encodeURIComponent(username)}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(credentialJSON)
    });
    if (!finishResp.ok) {
      throw new Error(`Finish registration failed: ${finishResp.status}`);
    }

    alert('Passkey registered successfully!');
  } catch (err) {
    alert(`Error: ${err.message}`);
    console.error(err);
  }
}

// Base64URL -> ArrayBuffer 変換
function base64UrlToArrayBuffer(base64UrlString) {
  // base64url => base64 に置換
  const base64 = base64UrlString.replace(/-/g, '+').replace(/_/g, '/');
  // 必要に応じてpadding
  const pad = 4 - (base64.length % 4);
  const padded = (pad !== 4) ? base64 + '='.repeat(pad) : base64;
  // デコード -> Uint8Array -> ArrayBuffer
  const rawData = window.atob(padded);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

// ArrayBuffer -> Base64URL 変換
function arrayBufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // base64 エンコード
  let base64 = window.btoa(binary);
  // base64 => base64url
  base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return base64;
}

// ページ読み込み時、ボタンにクリックイベントを紐付け
document.addEventListener('DOMContentLoaded', () => {
  const registerBtn = document.getElementById('registerBtn');
  registerBtn.addEventListener('click', () => {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();
    if (!username) {
      alert('Username is empty!');
      return;
    }
    registerPasskey(username);
  });
});
