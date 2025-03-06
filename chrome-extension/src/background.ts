import {log} from "./pkg/log";
import {getAssertion} from "./api/get-assertion";
import {createKey} from "./api/create-key";
import {getAvailableCredentialIds} from "./api/check";

let isAttached = true;

// WebAuthnプロキシのアタッチ
chrome.webAuthenticationProxy.attach(() => {
  log('[Extension] Attached to WebAuthn');
  isAttached = true;
});

// プロキシを一時的にデタッチし、後で再アタッチする関数
async function detachAndReattachLater() {
  if (isAttached) {
    log('[Extension] Detaching WebAuthn proxy to let device handle the request');
    chrome.webAuthenticationProxy.detach();
    isAttached = false;

    setTimeout(() => {
      chrome.webAuthenticationProxy.attach(() => {
        log('[Extension] Re-attached to WebAuthn');
        isAttached = true;
      });
    }, 5000);
  }
}

chrome.webAuthenticationProxy.onCreateRequest.addListener(async (requestInfo) => {
  log('WebAuthn onCreateRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;

  try {
    const details = JSON.parse(requestDetailsJson);
    const rpId = details.rp?.id || '';

    // TODO: ask user to choose whether to let Chrome Extension handle the request
    // if (!shouldHandle) {
    //   log(`[Extension] No passkey configuration for ${rpId}, detaching proxy`);
    //   // リクエストを拒否してプロキシをデタッチ
    //   await chrome.webAuthenticationProxy.completeCreateRequest({
    //     requestId,
    //     error: {name: 'NotSupportedError', message: 'Letting device handle this request'}
    //   });
    //
    //   await detachAndReattachLater();
    //   return;
    // }

    const respJson = await createKey(requestInfo);

    await chrome.webAuthenticationProxy.completeCreateRequest({
      requestId,
      responseJson: respJson
    });

    log('completeCreateRequest sent for requestId:', requestId);
  } catch (error) {
    console.error('Registration error:', error);

    // エラーを報告
    await chrome.webAuthenticationProxy.completeCreateRequest({
      requestId,
      error: {name: 'NotAllowedError', message: 'Registration failed'}
    });
  }
});

chrome.webAuthenticationProxy.onGetRequest.addListener(async (requestInfo) => {
  log('WebAuthn onGetRequest:', requestInfo);
  const {requestId, requestDetailsJson} = requestInfo;

  try {
    const details = JSON.parse(requestDetailsJson);
    const rpId = details.rpId || '';
    const credentialIds = details.allowCredentials?.map((cred: any) => cred.id);
    const availableCredIDs = await getAvailableCredentialIds(rpId, credentialIds);
    if (availableCredIDs.length === 0) {
      log(`[Extension] No matching passkey for ${rpId}, detaching proxy`);
      await chrome.webAuthenticationProxy.completeGetRequest({
        requestId,
        error: {name: 'NotSupportedError', message: 'Letting device handle this request'}
      });
      await detachAndReattachLater();
      return;
    }

    const body = await getAssertion(requestInfo)
    log('Response from get-assertion:', body);

    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      responseJson: body
    });

    log('completeGetRequest sent for requestId:', requestId);
  } catch (error) {
    console.error('Authentication error:', error);

    // エラーを報告
    await chrome.webAuthenticationProxy.completeGetRequest({
      requestId,
      error: {name: 'NotAllowedError', message: 'Authentication failed'}
    });
  }
});