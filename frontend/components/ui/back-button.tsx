const BackButton = ({ onClick }: { onClick: () => void }) => {
    return (
      <button onClick={onClick} className="back-button">
        <span>Back</span>
        <style jsx>{`
          .back-button {
            display: flex;
            align-items: center;
            padding: 8px 16px;
            background-color: #0070f3;
            color: white;
            border: none;
            border-radius: 24px;
            cursor: pointer;
            transition: background-color 0.2s;
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
          }
  
          .back-button:hover {
            background-color: #0053b3;
          }
  
          .back-button span {
            margin-left: 8px;
          }
        `}</style>
      </button>
    );
  };
  
  export default BackButton;
