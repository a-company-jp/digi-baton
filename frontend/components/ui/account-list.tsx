import { Account, AccountListItem } from "./account-list-item";

export const AccountList = ({ accounts}: { accounts: Account[] }) => {
      return (
        <div className="account-list-container">
            {accounts.map((app) => (
                <AccountListItem account={app} />
            ))}
        </div>
      );
}

