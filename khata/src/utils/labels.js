import { t } from "../i18n";

const METHOD_KEYS = { Cash: "cash", "Bank Transfer": "bank", JazzCash: "jazzcash", Easypaisa: "easypaisa", Other: "other" };
const UNIT_KEYS = ["kg", "gram", "litre", "piece", "packet"];

// Only the built-in units and methods are translated; text typed by the user is shown exactly as saved
export const unitLabel = (u) => (UNIT_KEYS.includes(String(u).toLowerCase()) ? t(`units.${String(u).toLowerCase()}`) : u);
export const methodLabel = (m) => (METHOD_KEYS[m] ? t(`methods.${METHOD_KEYS[m]}`) : m);
