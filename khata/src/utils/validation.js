import { CNIC_RE } from "../constants";

export const isValidCnic = (cnic) => CNIC_RE.test(cnic);

// Khata entry line checks: a line that has any input must be fully filled.
export const LINE_FIELD_KEYS = { name: "khata.fieldName", qty: "khata.fieldQty", unit: "khata.fieldUnit", price: "khata.fieldRate" };
export const lineTouched = (l) => Boolean(String(l.name).trim() || l.price > 0);
export const lineMissing = (l) => {
  const m = [];
  if (!String(l.name).trim()) m.push("name");
  if (!(l.qty > 0)) m.push("qty");
  if (!String(l.unit).trim()) m.push("unit");
  if (!(l.price > 0)) m.push("price");
  return m;
};
