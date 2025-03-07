import { motion } from 'framer-motion';

type AccountInfo = { name: string; initial: string };

export default function KeyperPopup(props: {
  isLoading: boolean;
  isComplete: boolean;
  accounts: AccountInfo[];
  handleRegister: (a: AccountInfo) => void;
  handleDeviceAuth: () => void;
  handleCancel: () => void;
}) {
  const mainAccount = props.accounts[0];
  return (
    <motion.div
      style={{ position: 'fixed', top: '20px', right: '20px' }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-80 p-4 z-[999999]
                 bg-gradient-to-br from-indigo-700 via-blue-800 to-violet-900
                 text-white rounded-2xl shadow-xl
                 flex flex-col space-y-4
                 overflow-hidden relative">
      {/* 上部ロゴ類 */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-4">
        <img
          src="https://dummyimage.com/600x400/5359cf/ffffff.png"
          alt="Keyper logo"
          className="h-12 w-auto object-contain"
        />
        <img
          src="https://dummyimage.com/100x100/5359cf/ffffff.png"
          alt="Keyper"
          className="hover:bg-white/20 rounded-md h-10 w-auto object-contain"
        />
      </div>

      <div className="flex flex-col items-center pt-4">
        <div className="bg-white/30 rounded-full p-4 size-[100px] flex items-center justify-center">
          <img src="http://static.shion.pro/digi-baton/key-vector.png" alt="test" />
        </div>
        <h2 className="text-lg font-bold mt-4">Keyper上のパスキーを登録する</h2>
      </div>
      <button
        className="bg-white/10 rounded-lg p-3 cursor-pointer"
        onClick={() => {
          props.handleRegister(mainAccount);
        }}
        disabled={props.isLoading} // ローディング中は押せなくする例
      >
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-full bg-white/30 text-white font-bold
                       flex items-center justify-center mr-3 text-lg">
            {mainAccount.initial}
          </div>
          <div className="text-base font-medium">{mainAccount.name}</div>
        </div>
        <div className="mt-2 px-3 py-1 text-sm bg-white/20 rounded-md hover:bg-white/30 disabled:bg-white/10">
          Login
        </div>
      </button>

      <div className="flex justify-end pt-2">
        <button
          className="px-4 py-2 flex-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 mr-2 disabled:bg-white/10"
          onClick={props.handleDeviceAuth}
          disabled={props.isLoading}>
          Use device passkey
        </button>
        <button
          className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 disabled:bg-white/10"
          onClick={props.handleCancel}
          disabled={props.isLoading}>
          Cancel
        </button>
      </div>
      {props.isLoading && (
        <motion.div
          key="overlay-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center">
          {/* スピナー的なものを回転させる例 (Framer Motionで回転) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-4 border-white border-t-transparent rounded-full"
          />
        </motion.div>
      )}
      {props.isComplete && (
        <motion.div
          key="overlay-complete"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-green-600 to-lime-600 flex items-center justify-center">
          {/* チェックアイコンなどをアニメーション付きで表示 */}
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-[100px] text-white">
            <motion.path
              d="M6 12 L10 16 L18 6"
              initial={{ pathLength: 0, scale: 0.8 }}
              animate={{ pathLength: 1, scale: 1.5 }}
              transition={{ duration: 0.5, ease: 'easeIn' }}
            />
          </motion.svg>
        </motion.div>
      )}
    </motion.div>
  );
}
