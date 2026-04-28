import Database from "better-sqlite3";
const db = new Database("backend/Data.db");

// 1. Setup Test Data
console.log("--- 🏁 Starting Verification Test ---");

// Clean old test data if exists
db.prepare("DELETE FROM sales WHERE customer_name = 'TEST_CUSTOMER'").run();
db.prepare("DELETE FROM payments WHERE customer_id = 9999").run();
db.prepare("DELETE FROM customers WHERE id = 9999").run();

// Mock customer
db.prepare("INSERT INTO customers (id, name, phone) VALUES (9999, 'TEST_CUSTOMER', '0000')").run();

// 2. Create Two Invoices
const date1 = new Date(Date.now() - 10000).toISOString();
const date2 = new Date().toISOString();

db.prepare(`
    INSERT INTO sales (id, customer_id, customer_name, total, paid, remaining, status, date)
    VALUES (8888, 9999, 'TEST_CUSTOMER', 100, 0, 100, 'UNPAID', ?)
`).run(date1);

db.prepare(`
    INSERT INTO sales (id, customer_id, customer_name, total, paid, remaining, status, date)
    VALUES (8889, 9999, 'TEST_CUSTOMER', 200, 0, 200, 'UNPAID', ?)
`).run(date2);

console.log("✅ Created Invoice 1 (100) and Invoice 2 (200)");

// 3. Simulate FIFO Payment (150)
// This is a copy of the logic in payments.mjs
const paymentAmount = 150;

const transaction = db.transaction((pAmount) => {
    let remainingToAllocate = pAmount;
    
    const findDebtSales = db.prepare(`
        SELECT id, remaining FROM sales 
        WHERE customer_id = 9999 AND remaining > 0 AND is_deleted = 0
        ORDER BY date ASC
    `);
    
    const updateSaleDebtResource = db.prepare(`
        UPDATE sales SET paid = paid + ?, remaining = MAX(0, total - (paid + ?)) WHERE id = ?
    `);
    
    const updateSaleStatus = db.prepare(`
        UPDATE sales SET status = CASE WHEN remaining <= 0 THEN 'PAID' ELSE 'PARTIALLY PAID' END WHERE id = ?
    `);

    const sales = findDebtSales.all();
    for (const sale of sales) {
        if (remainingToAllocate <= 0) break;
        const pForThisSale = Math.min(sale.remaining, remainingToAllocate);
        updateSaleDebtResource.run(pForThisSale, pForThisSale, sale.id);
        updateSaleStatus.run(sale.id);
        remainingToAllocate -= pForThisSale;
    }
    
    db.prepare("INSERT INTO payments (customer_id, amount, date) VALUES (9999, ?, ?)").run(pAmount, new Date().toISOString());
});

transaction(paymentAmount);
console.log("✅ Processed 150 EGP Payment via FIFO");

// 4. Verify DB State (Read directly from DB)
const results = db.prepare("SELECT id, total, paid, remaining, status FROM sales WHERE customer_id = 9999 ORDER BY id ASC").all();

console.log("\n--- 📊 Database Results ---");
results.forEach(row => {
    console.log(`Invoice #${row.id}: Total=${row.total}, Paid=${row.paid}, Remaining=${row.remaining}, Status=${row.status}`);
});

// Validation
if (results[0].status === 'PAID' && results[1].status === 'PARTIALLY PAID' && results[1].remaining === 150) {
    console.log("\n🔥 VERIFICATION SUCCESSFUL: FIFO is working perfectly and persisting to DB.");
} else {
    console.log("\n❌ VERIFICATION FAILED: Data inconsistency detected.");
}

// Cleanup
db.prepare("DELETE FROM sales WHERE customer_id = 9999").run();
db.prepare("DELETE FROM payments WHERE customer_id = 9999").run();
db.prepare("DELETE FROM customers WHERE id = 9999").run();
