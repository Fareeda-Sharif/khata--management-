import { naskh400, naskh700, sans400, sans700 } from "../../assets/fonts/fontData";

// Noto Naskh Arabic (Urdu) + Noto Sans (Latin), SIL Open Font License. Embedded in every PDF that needs them.
const toBytes = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
let cache;
export const loadFontBytes = () => (cache ||= { ar: toBytes(naskh400), arB: toBytes(naskh700), lat: toBytes(sans400), latB: toBytes(sans700) });
