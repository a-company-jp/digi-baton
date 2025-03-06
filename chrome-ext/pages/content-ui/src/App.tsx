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

  useEffect(() => {
    const handleMessage = (request: { reqType: string }) => {
      switch (request.reqType) {
        case 'passkey-creation':
          setIsLogin(false);
          setShowPasskeyPopup(true);
          break;
        case 'passkey-use':
          setIsLogin(true);
          setShowPasskeyPopup(true);
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

  const loginWithAccount = (a: AccountInfo) => {
    console.log('Login triggered');
    setShowPasskeyPopup(false);
  };

  const registerWithAccount = (a: AccountInfo) => {
    console.log('Register triggered');
    setShowPasskeyPopup(false);
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
            isLoading={false}
            isComplete={false}
            accounts={accounts}
            handleLogin={loginWithAccount}
            handleDeviceAuth={continueWithDeviceAuthGet}
            handleCancel={() => setShowPasskeyPopup(false)}
          />
        ) : (
          <PasskeyCreatePopUp
            isLoading={false}
            isComplete={false}
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
