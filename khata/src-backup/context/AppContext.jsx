import { createContext, useContext } from "react";

// Gives modals and deep components the live data (so a modal never shows stale numbers)
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
