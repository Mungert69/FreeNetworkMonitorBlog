import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";

const SearchModal = ({ searchModal, setSearchModal }) => {
  const router = useRouter();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!searchModal) return undefined;

    document.getElementById("searchModal")?.focus();

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSearchModal(false);
        return;
      }

      if (e.key !== "Enter") return;
      if (document.activeElement?.id !== "searchModal") return;

      const trimmedInput = input.trim();
      if (!trimmedInput) {
        setSearchModal(false);
        return;
      }

      router.push({ pathname: "/search", query: { key: trimmedInput } });
      setSearchModal(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [input, router, searchModal, setSearchModal]);
  return (
    <div className={`search-modal ${searchModal ? "open" : ""}`}>
      <button onClick={() => setSearchModal(false)} className="search-close">
        <IoCloseCircleOutline />
      </button>
      <input
        type="text"
        className="form-input bg-body placeholder:text-base dark:bg-darkmode-body"
        id="searchModal"
        placeholder="Type and hit enter..."
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  );
};

export default SearchModal;
