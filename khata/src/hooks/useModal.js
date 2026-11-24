import { useState } from "react";

export function useModal() {
  const [modal, setModal] = useState(null); // { node, wide }
  const open = (node, wide) => setModal({ node, wide });
  const close = () => setModal(null);
  return { modal, open, close };
}
