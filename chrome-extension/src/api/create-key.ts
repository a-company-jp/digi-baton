import {log} from "../pkg/log";
import CreateRequest = chrome.webAuthenticationProxy.CreateRequest;

const createKey = async (reqInfo: CreateRequest): Promise<string> => {
  const resp = await fetch('http://localhost:8083/create-key', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(reqInfo),
  });

  if (!resp.ok) {
    throw new Error(`Server returned ${resp.status}: ${resp.statusText}`);
  }
  const body = await resp.text();
  log('Response from create-key:', body);
  return body
}

export {
  createKey
}