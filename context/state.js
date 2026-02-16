import { createContext, useContext } from "react";
import generatedPosts from "../.json/posts.json";
import bundledPosts from "../posts.json";

const SearchContext = createContext();

export const JsonContext = ({ children }) => {
  const toArray = (value) => (Array.isArray(value) ? value : []);
  const generated = toArray(generatedPosts);
  const bundled = toArray(bundledPosts);
  const posts = generated.length > 0 ? generated : bundled;

  const state = {
    posts,
  };
  return (
    <SearchContext.Provider value={state}>{children}</SearchContext.Provider>
  );
};

export const useSearchContext = () => {
  return useContext(SearchContext);
};
