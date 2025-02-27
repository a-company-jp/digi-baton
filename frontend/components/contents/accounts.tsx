import { useState, useRef, useEffect } from "react";
import { Account } from "../ui/account-list-item";
import { AccountList } from "../ui/account-list";
import { SearchBox } from "../ui/search-box";
import { AccountForm } from "../ui/account-form";
import BackButton from "../ui/back-button";
import AddButton from "../ui/add-button";

const Page = () => {

  const [selectedApp, setSelectedApp] = useState<Account | undefined>();
  const [popupVisible, setPopupVisible] = useState<boolean>(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleAppClick = (app: Account) => {
    setSelectedApp(app);
    setPopupVisible(true);
  };


  const accounts = createSampleAccounts(handleAppClick);

  return (
    <>
      <div className="w-1/2 my-12 mx-auto">
        <SearchBox placeholder="type application name" />
      </div>

      {popupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray bg-opacity-50 z-10">
          <div ref={formRef}>
            <AccountForm appName={selectedApp?.name || ''} goBack={() => setPopupVisible(false)} />
          </div>
        </div>
      )}

      <AccountList accounts={accounts} />
      
    </>
  );
};

const useAppListItem = (id: number, iconUrl: string, name: string, defaultActive: boolean = false, onClick: (app: Account) => void): Account => {
  const [active, setActive] = useState<boolean>(defaultActive);
  const toggleActive = () => {
      setActive((prevActive) => !prevActive);
  }
  
  const onClickSettings = () => {
      onClick({ id, iconUrl, name, active, toggleActive, onClickSettings });
  }
  
  return { id, iconUrl, name, active, toggleActive, onClickSettings };
}

const createSampleAccounts = (onClickSettings: (app: Account) => void) => {
  const accounts: Account[] = [];

  // 一旦ここで定義
  const iconUrls = [
      'https://cdn-icons-png.flaticon.com/512/270/270014.png',
      'https://cdn-icons-png.flaticon.com/512/145/145802.png',
      'https://cdn-icons-png.flaticon.com/512/733/733579.png',
      'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      'https://cdn-icons-png.flaticon.com/512/2111/2111399.png',
      'https://cdn-icons-png.flaticon.com/512/2111/2111615.png',
      'https://cdn-icons-png.flaticon.com/512/25/25231.png',
  ];
  const appNames = ['Google', 'Facebook', 'Twitter', 'Instagram', 'LinkedIn', 'Slack', 'GitHub', 'GitLab', 'Bitbucket'];
  for (let i = 0; i < iconUrls.length; i++) {
      const account = useAppListItem(i, iconUrls[i], appNames[i], i % 2 === 0, onClickSettings);
      accounts.push(account);
  }
  return accounts;
}

export default Page;
