import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { SuccessorsTable } from "../ui/successors-table";
import { SearchBox } from "../ui/search-box";
import BackButton from "../ui/back-button";
import AddButton from "../ui/add-button";
import { SuccessorForm } from "../ui/successor-form";


const Page = () => {
  const successors = [
    {
      name: "John Doe",
      email: "john.doe@example.com",
      relation: "Friend",
      active: true,
    },
    {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      relation: "Colleague",
      active: false,
    },
    {
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      relation: "Family",
      active: true,
    },
  ];

  const [popupVisible, setPopupVisible] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  

  return (
    <>
      <div className="w-1/2 my-12 mx-auto">
        <SearchBox placeholder="type successor name or email" />
      </div>

      <SuccessorsTable successors={successors} />

      {popupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray bg-opacity-50 z-10">
        <div ref={formRef}>
          <SuccessorForm goBack={() => setPopupVisible(false)}/>
        </div>
      </div>
      )}

      {popupVisible ? (
        <BackButton onClick={() => setPopupVisible(false)} />
      ) : (
        <AddButton text="Add Successor" onClick={() => setPopupVisible(true)} />
      )}
    </>
  );
};

export default Page;
