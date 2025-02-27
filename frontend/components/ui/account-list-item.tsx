export type Account = {
  id: number;
  iconUrl: string;
  name: string;
  active: boolean;
  toggleActive: () => void;
  onClickSettings: () => void;
};

export const AccountListItem = ({ account }: { account: Account }) => {
  return (
    <>
      <div className="account-list-item" key={account.id}>
        <img
          className="account-icon"
          src={account.iconUrl}
          alt={`${account.name} icon`}
        />
        <span className="account-name">{account.name}</span>
        <Switch id={account.id} />
        <SettingsButton onClick={account.onClickSettings} />
      </div>
      <style jsx>{`
        .account-list-container {
          width: 50%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .account-list-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
          margin: 5px 0;
        }

        .account-icon {
          width: 40px;
          height: 40px;
          margin-right: 10px;
        }

        .account-name {
          flex: 1;
          font-size: 16px;
        }
      `}</style>
    </>
  );
};

const Switch = ({ id }: { id: number }) => {
  const switchId = `switch-${id}`;
  return (
    <div className="checkbox-wrapper-8 mx-4">
      <input
        type="checkbox"
        id={switchId}
        className="tgl tgl-skewed"
        aria-label="Toggle active state"
      />
      <label
        htmlFor={switchId}
        data-tg-on="Takeover"
        data-tg-off="Delete"
        className="tgl-btn"
      />

      <style jsx>{`
        .checkbox-wrapper-8 .tgl {
          display: none;
        }

        .checkbox-wrapper-8 .tgl,
        .checkbox-wrapper-8 .tgl:after,
        .checkbox-wrapper-8 .tgl:before,
        .checkbox-wrapper-8 .tgl *,
        .checkbox-wrapper-8 .tgl *:after,
        .checkbox-wrapper-8 .tgl *:before,
        .checkbox-wrapper-8 .tgl + .tgl-btn {
          box-sizing: border-box;
        }

        .checkbox-wrapper-8 .tgl + .tgl-btn {
          outline: 0;
          display: block;
          width: 6em;
          height: 2em;
          position: relative;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-wrapper-8 .tgl + .tgl-btn:after,
        .checkbox-wrapper-8 .tgl + .tgl-btn:before {
          position: relative;
          display: block;
          content: "";
          width: 50%;
          height: 100%;
        }

        .checkbox-wrapper-8 .tgl + .tgl-btn:after {
          left: 0;
        }

        .checkbox-wrapper-8 .tgl + .tgl-btn:before {
          display: none;
        }

        .checkbox-wrapper-8 .tgl:checked + .tgl-btn:after {
          left: 50%;
        }

        .checkbox-wrapper-8 .tgl-skewed + .tgl-btn {
          overflow: hidden;
          transform: skew(-10deg);
          backface-visibility: hidden;
          transition: all 0.2s ease;
          font-family: sans-serif;
          background: red;
        }

        .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:after,
        .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:before {
          transform: skew(10deg);
          display: inline-block;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
          position: absolute;
          line-height: 2em;
          font-weight: bold;
          color: #fff;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
        }

        .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:after {
          left: 100%;
          content: attr(data-tg-on);
        }

        .checkbox-wrapper-8 .tgl-skewed + .tgl-btn:before {
          left: 0;
          content: attr(data-tg-off);
        }

        .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn {
          background: #86d993;
        }

        .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn:before {
          left: -100%;
        }

        .checkbox-wrapper-8 .tgl-skewed:checked + .tgl-btn:after {
          left: 0;
        }
      `}</style>
    </div>
  );
};

const SettingsButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <>
        <button className="settings-button" onClick={onClick}>Settings</button>
        <style jsx>{`
          .settings-button {
            background-color: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 5px 10px;
            cursor: pointer;
          }
        `}</style>
      </>
    );
};
