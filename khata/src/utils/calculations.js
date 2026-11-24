export { bal, buildLedger, etot } from "./ledger";

export const cust = (db, c) => db.customers.find((x) => x.cnic === c);
export const cname = (db, c) => cust(db, c)?.name || c;
