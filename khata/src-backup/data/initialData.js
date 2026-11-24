import { ago, today } from "../utils/formatting";

const at = (n, h = 10, m = 0) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, m, 0, 0); return d.toISOString(); };

// Demo data used by the offline/local build the first time it opens
export const seed = () => ({
  nid: 20,
  settings: { shopName: "Al-Madina General Store", phone: "0300-1234567", address: "Main Bazar, Skardu", note: "Thank you for your business" },
  customers: [
    { cnic: "36302-1234567-1", name: "Ali Raza", phone: "0300-1112233", address: "Mohalla Gulshan, Skardu", opening: 1000, arch: false, createdAt: at(40) },
    { cnic: "36302-7654321-9", name: "Bashir Ahmed", phone: "0311-2223344", address: "Main Bazar, Skardu", opening: 0, arch: false, createdAt: at(30) },
    { cnic: "36302-1122334-5", name: "Fatima Bibi", phone: "0345-5556677", address: "Kharmang Road", opening: 300, arch: false, createdAt: at(20) },
  ],
  items: [
    { id: 1, name: "Rice", unit: "kg", price: 280, on: true },
    { id: 2, name: "Sugar", unit: "kg", price: 150, on: true },
    { id: 3, name: "Milk", unit: "litre", price: 220, on: true },
    { id: 4, name: "Cooking Oil", unit: "packet", price: 620, on: true },
    { id: 5, name: "Eggs", unit: "piece", price: 35, on: true },
  ],
  entries: [
    { id: 1, kind: "purchase", cnic: "36302-1234567-1", date: ago(8), note: "", paid: 0, createdAt: at(8, 11), updatedAt: at(8, 11), lines: [{ name: "Rice", qty: 5, unit: "kg", price: 280 }, { name: "Sugar", qty: 2, unit: "kg", price: 150 }] },
    { id: 2, kind: "purchase", cnic: "36302-7654321-9", date: ago(5), note: "Evening order", paid: 500, paidMethod: "Cash", createdAt: at(5, 18, 30), updatedAt: at(5, 18, 30), lines: [{ name: "Cooking Oil", qty: 2, unit: "packet", price: 620 }] },
    { id: 3, kind: "purchase", cnic: "36302-1234567-1", date: ago(3), note: "", paid: 0, createdAt: at(3, 9, 15), updatedAt: at(3, 9, 15), lines: [{ name: "Milk", qty: 4, unit: "litre", price: 220 }] },
    { id: 4, kind: "purchase", cnic: "36302-1122334-5", date: today(), note: "", paid: 0, createdAt: at(0, 9, 5), updatedAt: at(0, 9, 5), lines: [{ name: "Eggs", qty: 12, unit: "piece", price: 35 }] },
  ],
  payments: [
    { id: 5, cnic: "36302-1234567-1", date: ago(6), amount: 1000, method: "Cash", note: "Part payment", createdAt: at(6, 12), updatedAt: at(6, 12) },
    { id: 6, cnic: "36302-1234567-1", date: ago(2), amount: 500, method: "JazzCash", note: "Against PUR-0003", entryId: 3, createdAt: at(2, 16), updatedAt: at(2, 16) },
    { id: 7, cnic: "36302-1122334-5", date: today(), amount: 200, method: "Easypaisa", note: "", createdAt: at(0, 10), updatedAt: at(0, 10) },
  ],
  misc: [
    { id: 8, type: "return", cnic: "36302-1234567-1", date: ago(4), amount: 150, note: "Returned 1 kg sugar", createdAt: at(4, 15), updatedAt: at(4, 15) },
  ],
});
