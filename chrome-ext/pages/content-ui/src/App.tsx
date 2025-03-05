import { useEffect } from 'react';
import PasskeyLoginPopUp from '@extension/ui/dist/lib/components/PasskeyLoginPopUp';

export default function App() {
  useEffect(() => {
    console.log('content ui loaded');
  }, []);

  return (
    <div>
      <PasskeyLoginPopUp />
    </div>
  );
}
