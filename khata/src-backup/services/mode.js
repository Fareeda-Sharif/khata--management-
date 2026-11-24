// With VITE_STORAGE=local the app runs without a server or login and keeps data in this browser (localStorage)
export const LOCAL_MODE = import.meta.env.VITE_STORAGE === "local";
