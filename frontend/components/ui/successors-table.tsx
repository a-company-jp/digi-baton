import React from "react";

interface Successor {
  name: string;
  email: string;
  relation: string;
  active: boolean;
}

interface SuccessorsTableComponentProps {
  successors: Successor[];
}

export const SuccessorsTable: React.FC<SuccessorsTableComponentProps> = ({
  successors,
}) => {
  return (
    <>
      <table className="successors-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Relation</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {successors.map((successor, index) => (
            <tr key={index}>
              <td>{successor.name}</td>
              <td>{successor.email}</td>
              <td>{successor.relation}</td>
              <td>{successor.active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .successors-table {
          width: 100%;
          border-collapse: collapse;
        }

        .successors-table th {
          background-color: gray;
          color: white;
          padding: 8px;
          text-align: left;
        }

        .successors-table td {
          padding: 8px;
          border: 1px solid #ddd;
        }

        .successors-table tr:nth-child(even) {
          background-color: #f2f2f2;
        }
      `}</style>
    </>
  );
};
