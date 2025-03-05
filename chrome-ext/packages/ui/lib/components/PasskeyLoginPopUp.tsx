import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function KeyperPopup() {
  // デモ用にサンプルアカウントを定義。
  const accounts = [
    { name: 'Alice@example.com', initial: 'A' },
    { name: 'Bob@example.com', initial: 'B' },
    { name: 'Charlie@example.com', initial: 'C' },
  ];

  const mainAccount = accounts[0];
  const otherAccounts = accounts.slice(1);

  const [showAll, setShowAll] = useState(false);

  // その他アカウント数
  const otherCount = otherAccounts.length;

  // 0件とそれ以外でバッジの色を調整
  const badgeClass = otherCount > 0 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50';

  return (
    <motion.div
      style={{ position: 'fixed', top: '20px', right: '20px' }}
      // 初期アニメーション
      initial={{ y: -20, opacity: 0 }}
      // アニメーション後
      animate={{ y: 0, opacity: 1 }}
      // アニメーション詳細設定
      transition={{ duration: 0.6, ease: 'easeOut' }}
      // レイアウトとデザイン
      className="w-80 p-4 z-[999999]
                 bg-gradient-to-br from-indigo-700 via-blue-800 to-violet-900
                 text-white rounded-2xl shadow-xl
                 flex flex-col space-y-4
                 overflow-hidden relative">
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
      <div className="flex flex-col items-center">
        <div className="bg-white/30 rounded-full p-4 size-[100px] flex items-center justify-center">
          {/* パスキーアイコン (適宜変更OK) */}
          <img src="http://static.shion.pro/digi-baton/key-vector.png" alt="test" />
        </div>
        <h2 className="text-lg font-bold mt-4">Login with Passkey</h2>
      </div>
      <button
        className="bg-white/10 rounded-lg p-3 cursor-pointer"
        onClick={() => {
          console.log('Login triggered for', mainAccount);
        }}>
        <div className="flex items-center">
          <div
            className="w-12 h-12 rounded-full bg-white/30 text-white font-bold
                       flex items-center justify-center mr-3 text-lg">
            {mainAccount.initial}
          </div>
          <div className="text-base font-medium">{mainAccount.name}</div>
        </div>
        <button
          className="mt-2 px-3 py-1 text-sm bg-white/20 rounded-md hover:bg-white/30"
          onClick={e => {
            // ボタンのクリックがonClickを伝播して親要素の選択イベントが発火しないように
            e.stopPropagation();
            console.log('Dummy login button clicked for', mainAccount);
          }}>
          Login
        </button>
      </button>

      <button
        className="w-full bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg flex justify-center"
        onClick={() => setShowAll(true)}>
        {/* ボタン左側のテキスト */}
        <span className="mr-2">Choose other accounts</span>
        {/* 丸い数字バッジ */}
        <div
          className={`min-w-[24px] h-6 flex items-center justify-center rounded-full px-1 text-sm font-medium ${badgeClass}`}>
          {otherCount}
        </div>
      </button>

      <div className="flex justify-end pt-2">
        <button
          className="px-4 py-2 flex-1 bg-white/20 rounded-lg text-sm hover:bg-white/30 mr-2"
          onClick={() => {
            console.log('Use device passkey clicked');
            // デバイスパスキーの利用に関連する処理など
          }}>
          Use device passkey
        </button>
        <button
          className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30"
          onClick={() => {
            console.log('Cancel clicked');
            // ポップアップを閉じる処理など
          }}>
          Cancel
        </button>
      </div>

      {/* 下から覆い被さるタブパネル */}
      {showAll && otherCount > 0 && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute bottom-0 left-0 w-full h-full backdrop-blur-md
                     text-white rounded-t-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="text-sm font-medium">Other Accounts</h3>
            <button className="text-sm underline" onClick={() => setShowAll(false)}>
              Close
            </button>
          </div>
          <ul className="mt-4 px-2 flex-1 overflow-auto">
            {otherAccounts.map((account, index) => (
              <button
                key={index}
                className="w-full flex items-center py-2 border-b border-white/20 last:border-b-0
                           hover:bg-white/10 cursor-pointer px-2 rounded-lg"
                onClick={() => {
                  console.log('Login triggered for', account);
                }}>
                <div
                  className="w-10 h-10 rounded-full bg-white/30 text-white font-bold
                             flex items-center justify-center mr-3">
                  {account.initial}
                </div>
                <div className="text-sm flex-1">{account.name}</div>
                <button
                  className="ml-auto px-3 py-1 text-sm bg-white/20 rounded-md hover:bg-white/30"
                  onClick={e => {
                    e.stopPropagation();
                    console.log('Dummy login button clicked for', account);
                  }}>
                  Login
                </button>
              </button>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
}
