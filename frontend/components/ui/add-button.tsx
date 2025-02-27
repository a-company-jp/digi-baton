import { Plus, Search } from "lucide-react";

const AddButton = ({ text, onClick }: { text:string; onClick: () => void }) => {
  return (
    <button onClick={onClick} className="add-button">
      <Plus size={24} />
      <span>{text}</span>
      <style jsx>{`
        .add-button {
          margin-bottom: 5rem;
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

        .add-button:hover {
          background-color: #0053b3;
        }

        .add-button span {
          margin-left: 8px;
        }
      `}</style>
    </button>
  );
};

export default AddButton;
