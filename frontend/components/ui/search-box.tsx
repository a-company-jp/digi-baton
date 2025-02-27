import React, { useState } from "react";

type SearchBoxProps = {
  placeholder?: string;
};

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "",
}: SearchBoxProps) => {
  const [query, setQuery] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle the search logic here
    console.log("Searching for:", query);
  };

  return (
    <>
      <div className="search-box">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="search-input"
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>

      <style jsx>{`
        .search-box {
          display: flex;
          justify-content: center;
          margin-top: 100px;
        }

        .search-box form {
          display: flex;
          width: 100%;
          max-width: 600px;
          border: 1px solid #dfe1e5;
          border-radius: 24px;
          box-shadow: 0 1px 6px rgba(32, 33, 36, 0.28);
        }

        .search-input {
          flex: 1;
          height: 44px;
          padding: 0 16px;
          border: none;
          border-radius: 24px 0 0 24px;
          outline: none;
          font-size: 16px;
        }

        .search-button {
          height: 44px;
          width: 100px;
          background-color: #f8f9fa;
          border: none;
          border-left: 1px solid #dfe1e5;
          border-radius: 0 24px 24px 0;
          cursor: pointer;
          font-size: 16px;
        }

        .search-button:hover {
          background-color: #e8e8e8;
        }
      `}</style>
    </>
  );
};
