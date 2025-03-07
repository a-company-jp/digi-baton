import 'webextension-polyfill';
import { createKey } from '@src/background/api/create-key';
import { getAssertion } from '@src/background/api/get-assertion';
import CreateRequest = chrome.webAuthenticationProxy.CreateRequest;
import GetRequest = chrome.webAuthenticationProxy.GetRequest;

console.log('Background loaded on', new Date().toLocaleTimeString());

import { log } from './pkg/log';

let isAttached = true;

// WebAuthnプロキシのアタッチ
chrome.webAuthenticationProxy.attach(() => {
  console.log('[Extension] Attached to WebAuthn');
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

const createRequestMap = new Map<number, CreateRequest>();
const getRequestMap = new Map<number, GetRequest>();

chrome.runtime.onConnect.addListener(function (port) {
  switch (port.name) {
    case 'passkeyCreateRequest':
      console.log('createRequest port connected');
      port.onMessage.addListener(function (msg: unknown) {
        console.log('createRequest message:', msg);
        const reqId = msg.reqId;
        if (!reqId || typeof reqId !== 'number') {
          console.error('invalid reqId:', reqId);
          return;
        }
        const req = createRequestMap.get(reqId);
        if (!req) {
          console.error(`Request not found for id ${reqId}`);
          return;
        }
        createRequestMap.delete(reqId);
        createKey(req).then(resp => {
          chrome.webAuthenticationProxy.completeCreateRequest(
            {
              requestId: reqId,
              responseJson: resp,
            },
            () => {
              port.postMessage({ success: true });
              port.disconnect();
            },
          );
        });
      });
      break;
    case 'passkeyGetRequest':
      console.log('getRequest port connected');
      port.onMessage.addListener(function (msg: unknown) {
        console.log('getRequest message:', msg);
        const reqId = msg.reqId;
        if (!reqId || typeof reqId !== 'number') {
          console.error('invalid reqId:', reqId);
          return;
        }
        const req = getRequestMap.get(reqId);
        if (!req) {
          console.error(`Request not found for id ${reqId}`);
          return;
        }
        getRequestMap.delete(reqId);
        console.log('req:', req);
        getAssertion(req).then(resp => {
          chrome.webAuthenticationProxy.completeGetRequest(
            {
              requestId: reqId,
              responseJson: resp,
            },
            () => {
              port.postMessage({ success: true });
              port.disconnect();
            },
          );
        });
      });
  }
});

chrome.webAuthenticationProxy.onCreateRequest.addListener(async (requestInfo: CreateRequest) => {
  console.log('WebAuthn onCreateRequest:', requestInfo);
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tabId = tab.id ?? null;
  if (!tabId) {
    console.error('No active tab found');
    return;
  }
  createRequestMap.set(requestInfo.requestId, requestInfo);
  const response = await chrome.tabs.sendMessage(tabId, { reqType: 'passkey-creation', reqId: requestInfo.requestId });
  console.log(response);
  return;
});

// // const [isPasskeyChallenge, setPasskeyChallenge] = useState(false);
// // setPasskeyChallenge(true);
// log('WebAuthn onCreateRequest:', requestInfo);
// const { requestId, requestDetailsJson } = requestInfo;
//
// try {
//   const details = JSON.parse(requestDetailsJson);
//   const rpId = details.rp?.id || '';
//   console.log('rpId', rpId);
//
//   // TODO: ask user to choose whether to let Chrome Extension handle the request
//   // if (!shouldHandle) {
//   //   log(`[Extension] No passkey configuration for ${rpId}, detaching proxy`);
//   //   // リクエストを拒否してプロキシをデタッチ
//   //   await chrome.webAuthenticationProxy.completeCreateRequest({
//   //     requestId,
//   //     error: {name: 'NotSupportedError', message: 'Letting device handle this request'}
//   //   });
//   //
//   //   await detachAndReattachLater();
//   //   return;
//   // }
//
//   const respJson = await createKey(requestInfo);
//
//   await chrome.webAuthenticationProxy.completeCreateRequest({
//     requestId,
//     responseJson: respJson,
//   });
//
//   log('completeCreateRequest sent for requestId:', requestId);
// } catch (error) {
//   console.error('Registration error:', error);
//
//   // エラーを報告
//   await chrome.webAuthenticationProxy.completeCreateRequest({
//     requestId,
//     error: { name: 'NotAllowedError', message: 'Registration failed' },
//   });
// }

chrome.webAuthenticationProxy.onGetRequest.addListener(async (requestInfo: GetRequest) => {
  console.log('onGetRequest', requestInfo);
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tabId = tab.id ?? null;
  if (!tabId) {
    console.error('No active tab found');
    return;
  }
  getRequestMap.set(requestInfo.requestId, requestInfo);
  await chrome.tabs.sendMessage(tabId, { reqType: 'passkey-get', reqId: requestInfo.requestId });
});

//
// try {
//   const details = JSON.parse(requestDetailsJson);
//   const rpId = details.rpId || '';
//   const credentialIds = details.allowCredentials?.map((cred: any) => cred.id);
//   const availableCredIDs = await getAvailableCredentialIds(rpId, credentialIds);
//   if (availableCredIDs.length === 0) {
//     log(`[Extension] No matching passkey for ${rpId}, detaching proxy`);
//     await chrome.webAuthenticationProxy.completeGetRequest({
//       requestId,
//       error: { name: 'NotSupportedError', message: 'Letting device handle this request' },
//     });
//     await detachAndReattachLater();
//     return;
//   }
//
//   const body = await getAssertion(requestInfo);
//   log('Response from get-assertion:', body);
//
//   await chrome.webAuthenticationProxy.completeGetRequest({
//     requestId,
//     responseJson: body,
//   });
//
//   log('completeGetRequest sent for requestId:', requestId);
// } catch (error) {
//   console.error('Authentication error:', error);
//
//   // エラーを報告
//   await chrome.webAuthenticationProxy.completeGetRequest({
//     requestId,
//     error: { name: 'NotAllowedError', message: 'Authentication failed' },
//   });
// }
