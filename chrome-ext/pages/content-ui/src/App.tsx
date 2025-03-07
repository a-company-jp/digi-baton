import { useState, useEffect } from 'react';
import PasskeyLoginPopUp from '@extension/ui/dist/lib/components/PasskeyLoginPopUp';
import PasskeyCreatePopUp from '@extension/ui/dist/lib/components/PasskeyCreatePopUp';

export type AccountInfo = { name: string; initial: string };

export default function App() {
  const [showPasskeyPopup, setShowPasskeyPopup] = useState(false);
  const [isLogin, setIsLogin] = useState(false);
  const accounts: AccountInfo[] = [
    { name: 'Alice@example.com', initial: 'A' },
    { name: 'Bob@example.com', initial: 'B' },
    { name: 'Charlie@example.com', initial: 'C' },
  ];

  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [reqId, setReqId] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date().toTimeString());

  useEffect(() => {
    const handleMessage = (request: { reqType: string; reqId: number }) => {
      switch (request.reqType) {
        case 'passkey-creation':
          setLastUpdated(new Date().toTimeString());
          setIsLogin(false);
          setIsLoading(false);
          setIsComplete(false);
          setShowPasskeyPopup(true);
          setReqId(request.reqId);
          break;
        case 'passkey-get':
          setLastUpdated(new Date().toTimeString());
          setIsLogin(true);
          setIsLoading(false);
          setIsComplete(false);
          setShowPasskeyPopup(true);
          setReqId(request.reqId);
          break;
        default:
          console.log('unknown request type');
      }
    };
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const loginWithAccount = (a: string) => {
    console.log('Login triggered with account:', a);
    setIsLoading(true);
    const port = chrome.runtime.connect({ name: 'passkeyGetRequest' });
    port.postMessage({ reqId });
    port.onMessage.addListener((msg: { success: boolean }) => {
      if (msg.success) {
        const time = lastUpdated;
        setIsLoading(false);
        setIsComplete(true);
        setTimeout(() => {
          if (time === lastUpdated) {
            setShowPasskeyPopup(false);
            setIsComplete(false);
          }
        }, 3000);
      }
    });
  };

  const registerWithAccount = (a: AccountInfo) => {
    console.log('Register triggered for account:', a);
    setIsLoading(true);
    const port = chrome.runtime.connect({ name: 'passkeyCreateRequest' });
    port.postMessage({ reqId });
    port.onMessage.addListener((msg: { success: boolean }) => {
      if (msg.success) {
        const time = lastUpdated;
        setIsLoading(false);
        setIsComplete(true);
        setTimeout(() => {
          setShowPasskeyPopup(false);
          setIsComplete(false);
          if (time === lastUpdated) {
            setShowPasskeyPopup(false);
            setIsComplete(false);
          }
        }, 3000);
      }
    });
  };

  const continueWithDeviceAuthRegister = () => {
    console.log('Continue with device auth');

    setShowPasskeyPopup(false);
  };

  const continueWithDeviceAuthGet = () => {
    console.log('Continue with device auth');

    setShowPasskeyPopup(false);
  };

  return (
    <div>
      {showPasskeyPopup ? (
        isLogin ? (
          <PasskeyLoginPopUp
            isLoading={isLoading}
            isComplete={isComplete}
            accounts={accounts}
            handleLogin={loginWithAccount}
            handleDeviceAuth={continueWithDeviceAuthGet}
            handleCancel={() => setShowPasskeyPopup(false)}
          />
        ) : (
          <PasskeyCreatePopUp
            isLoading={isLoading}
            isComplete={isComplete}
            accounts={accounts}
            handleRegister={registerWithAccount}
            handleDeviceAuth={continueWithDeviceAuthRegister}
            handleCancel={() => setShowPasskeyPopup(false)}
          />
        )
      ) : (
        <></>
      )}
    </div>
  );
}
