'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CircleIcon } from 'lucide-react';
import AccountsContent from '@/components/contents/accounts';
import SuccessorsContent from '@/components/contents/successors';
// import SettingsContent from '@/components/contents/settings';


interface SidePanelProps {}

const SidePanel: React.FC<SidePanelProps> = () => {
  const [selectedItem, setSelectedItem] = useState<string>('accounts');

  const renderContent = () => {
    switch (selectedItem) {
      case 'accounts':
        return <AccountsContent />;
      case 'successors':
        return <SuccessorsContent />;
      // case 'settings':
      //   return <SettingsContent />;
      default:
        return <AccountsContent />;
    }
  };

  return (
    <>
      <header className="border-b border-gray-200">
      <div className="max-w-8xl  px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <CircleIcon className="h-6 w-6 text-orange-500" />
          <span className="ml-2 text-xl font-semibold text-gray-900">Digi Baton</span>
        </Link>
        <div className="flex items-center space-x-4">
          <CircleIcon className="h-12 w-12 text-orange-500 mx-12" />
        </div>
      </div>
    </header>

    <div className="side-panel">
      <div className="side-panel-menu">
        <div className={`menu-item ${selectedItem === 'accounts' ? 'selected' : ''}`} onClick={() => setSelectedItem('accounts')}>
          Accounts
        </div>
        <div className={`menu-item ${selectedItem === 'successors' ? 'selected' : ''}`} onClick={() => setSelectedItem('successors')}>
          Successors
        </div>
        {/* <div className={`menu-item ${selectedItem === 'settings' ? 'selected' : ''}`} onClick={() => setSelectedItem('settings')}>
          Settings
        </div> */}
      </div>
      <div className="side-panel-content">
        {renderContent()}
      </div>
    </div>
    
    <style jsx>{`
      .side-panel {
        display: flex;
        height: 100vh;
      }

      .side-panel-menu {
        width: 200px;
        background-color: #f0f0f0;
        padding: 10px;
      }

      .menu-item {
        padding: 10px;
        cursor: pointer;
      }

      .menu-item.selected {
        background-color: #d0d0d0;
        font-weight: bold;
      }

      .side-panel-content {
        flex-grow: 1;
        padding: 20px;
      }
    `}</style>

    </>

    
  );
};

export default SidePanel;
