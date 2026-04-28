import Database from "better-sqlite3";
const db = new Database("backend/Data.db");

console.log("--- 🕵️ Database Dump: Sales Table ---");
const sales = db.prepare("SELECT id, customer_name, total, paid, remaining, status FROM sales LIMIT 20").all();
console.table(sales);

console.log("\n--- 🕵️ Database Dump: Payments Table ---");
const payments = db.prepare("SELECT * FROM payments LIMIT 20").all();
console.table(payments);
