import { useState } from "react";

export function useToast() {
  const [message, setMessage] = useState("");
  const toast = (t) => { setMessage(t); setTimeout(() => setMessage(""), 2200); };
  return { message, toast };
}
