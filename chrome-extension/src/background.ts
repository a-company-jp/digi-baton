let isAttached = true;

// WebAuthnプロキシのアタッチ
chrome.webAuthenticationProxy.attach(() => {
  console.log('[Extension] Attached to WebAuthn');
  isAttached = true;
});

interface CredentialInfo {
  id: string;             // Base64
  userId: string | null;  // Base64
  signCount: number;
}

// サーバーにパスキーが存在するかどうかを確認する関数
async function checkPasskeyExists(rpId: string, credentialId?: string): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:8083/check-passkey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rpId,
        credentialId
      }),
    });
    
    if (!response.ok) {
      return false;
    }
    
    const result = await response.json();
    return result.exists === true;
  } catch (error) {
    console.error('Error checking passkey existence:', error);
    return false;
  }
}

// プロキシを一時的にデタッチし、後で再アタッチする関数
async function detachAndReattachLater() {
  if (isAttached) {
    console.log('[Extension] Detaching WebAuthn proxy to let device handle the request');
    chrome.webAuthenticationProxy.detach();
    isAttached = false;
    
    // 一定時間後に再アタッチ
    setTimeout(() => {
      chrome.webAuthenticationProxy.attach(() => {
        console.log('[Extension] Re-attached to WebAuthn');
        isAttached = true;
      });
    }, 5000); // 5秒後に再アタッチ
  }
}

// 作成リクエストのハンドラー
chrome.webAuthenticationProxy.onCreateRequest.addListener(async (requestInfo) => {
  console.log('WebAuthn onCreateRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;
  
  try {
    const details = JSON.parse(requestDetailsJson);
    const rpId = details.rp?.id || '';
    
    // このリクエストを処理すべきかどうかを確認
    // 例：特定のrpIdのみを処理する場合など
    const shouldHandle = await checkPasskeyExists(rpId);
    
    if (!shouldHandle) {
      console.log(`[Extension] No passkey configuration for ${rpId}, detaching proxy`);
      // リクエストを拒否してプロキシをデタッチ
      await chrome.webAuthenticationProxy.completeCreateRequest({
        requestId,
        error: {name: 'NotSupportedError', message: 'Letting device handle this request'}
      });
      
      await detachAndReattachLater();
      return;
    }
    
    // サーバーにリクエストを転送
    const resp = await fetch('http://localhost:8083/create-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestInfo),
    });
    
    if (!resp.ok) {
      throw new Error(`Server returned ${resp.status}: ${resp.statusText}`);
    }
    
    const body = await resp.text();
    console.log('Response from create-key:', body);
    
    await chrome.webAuthenticationProxy.completeCreateRequest({
      requestId,
      responseJson: body
    });
    
    console.log('completeCreateRequest sent for requestId:', requestId);
  } catch (error) {
    console.error('Registration error:', error);
    
    // エラーを報告
    await chrome.webAuthenticationProxy.completeCreateRequest({
      requestId,
      error: {name: 'NotAllowedError', message: 'Registration failed'}
    });
  }
});

// 認証（取得）リクエストのハンドラー
chrome.webAuthenticationProxy.onGetRequest.addListener(async (requestInfo) => {
  console.log('WebAuthn onGetRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;
  
  try {
    const details = JSON.parse(requestDetailsJson);
    const rpId = details.rpId || '';
    
    // allowCredentialsから最初のIDを取得（存在する場合）
    let credentialId = null;
    if (details.allowCredentials && details.allowCredentials.length > 0) {
      credentialId = details.allowCredentials[0].id;
    }
    
    // このリクエストを処理すべきかどうかを確認
    const shouldHandle = await checkPasskeyExists(rpId, credentialId);
    
    if (!shouldHandle) {
      console.log(`[Extension] No matching passkey for ${rpId}, detaching proxy`);
      // リクエストを拒否してプロキシをデタッチ
      await chrome.webAuthenticationProxy.completeGetRequest({
        requestId,
        error: {name: 'NotSupportedError', message: 'Letting device handle this request'}
      });
      
      await detachAndReattachLater();
      return;
    }
    
    // サーバーにリクエストを転送
    const resp = await fetch('http://localhost:8083/get-assertion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestInfo),
    });
    
    if (!resp.ok) {
      throw new Error(`Server returned ${resp.status}: ${resp.statusText}`);
    }
    
    const body = await resp.text();
    console.log('Response from get-assertion:', body);
    
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      responseJson: body
    });
    
    console.log('completeGetRequest sent for requestId:', requestId);
  } catch (error) {
    console.error('Authentication error:', error);
    
    // エラーを報告
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      error: {name: 'NotAllowedError', message: 'Authentication failed'}
    });
  }
});