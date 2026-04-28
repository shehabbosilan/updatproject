import Database from "better-sqlite3";
const db = new Database("Data.db");

// Find all customers
const customers = db.prepare("SELECT id FROM customers").all();

for (const customer of customers) {
  const customerId = customer.id;
  
  // Get all sales for this customer
  const sales = db.prepare("SELECT id, paid, date FROM sales WHERE customer_id = ? AND paid > 0").all(customerId);
  
  // Get all ledger payments for this customer
  const payments = db.prepare("SELECT amount, date FROM payments WHERE customer_id = ?").all(customerId);
  
  const totalPaidInSales = sales.reduce((acc, s) => acc + s.paid, 0);
  const totalInPaymentsTable = payments.reduce((acc, p) => acc + p.amount, 0);
  
  const diff = totalPaidInSales - totalInPaymentsTable;
  
  if (diff > 0.01) {
    console.log(`Customer ${customerId} has ${diff} missing from payments table. Fixing...`);
    
    // We assume the difference is from initial checkout payments.
    // We'll insert one payment record for each sale that had a non-zero paid amount 
    // IF it looks like it's missing.
    // To be safe, we'll just insert a single "Initial Balance Adjustment" or similar?
    // No, let's try to match them.
    
    for (const sale of sales) {
      // Check if there's any payment record with the exact same date and amount
      const exists = db.prepare("SELECT id FROM payments WHERE customer_id = ? AND amount = ? AND date = ?").get(customerId, sale.paid, sale.date);
      if (!exists) {
         console.log(`Inserting missing checkout payment for Sale #${sale.id}: ${sale.paid}`);
         db.prepare("INSERT INTO payments (customer_id, amount, date) VALUES (?, ?, ?)").run(customerId, sale.paid, sale.date);
      }
    }
  }
}

console.log("Data repair complete.");
