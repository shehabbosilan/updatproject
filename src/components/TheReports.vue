<template>
  <div class="reports-page">
    <div class="page-header">
      <h1 class="page-title">{{ $t('reports.title') }}</h1>
    </div>

    <!-- 1. Sales Reports Section -->
    <div class="card report-section">
      <div class="card-header">
        <h2 class="card-title">{{ $t('reports.financial') }}</h2>
      </div>
      <div class="report-filters">
        <div class="form-group">
          <label class="form-label">{{ $t('common.from') }}</label>
          <input type="date" class="form-control" v-model="salesReport.filters.fromDate" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('common.to') }}</label>
          <input type="date" class="form-control" v-model="salesReport.filters.toDate" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="generateSalesReport" :disabled="loading.sales">
            {{ loading.sales ? $t('reports.generating') : $t('reports.generate') }}
          </button>
          <button class="btn btn-secondary" @click="exportSalesExcel" :disabled="!salesReport.data.sales.length">
            📊 {{ $t('reports.export_excel') }}
          </button>
        </div>
      </div>

      <div v-if="salesReport.data.summary" class="report-summary-stats">
        <div class="stats-grid mini">
          <div class="stat-card">
            <div class="stat-label">{{ $t('dashboard.revenue') }}</div>
            <div class="stat-value">{{ $t('common.egp') }} {{ salesReport.data.summary.total_sales.toFixed(2) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">{{ $t('common.paid') }}</div>
            <div class="stat-value text-success">{{ $t('common.egp') }} {{ salesReport.data.summary.total_paid.toFixed(2) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">{{ $t('dashboard.debt') }}</div>
            <div class="stat-value text-danger">{{ $t('common.egp') }} {{ salesReport.data.summary.total_remaining.toFixed(2) }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">{{ $t('suppliers.orders') }}</div>
            <div class="stat-value">{{ salesReport.data.summary.number_of_orders }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Customer Statement Section -->
    <div class="card report-section">
      <div class="card-header">
        <h2 class="card-title">{{ $t('reports.statement') }}</h2>
      </div>
      <div class="report-filters">
        <div class="form-group">
          <label class="form-label">{{ $t('sales.customer') }}</label>
          <select class="form-control" v-model="selectedCustomer">
            <option :value="null">-- {{ $t('sales.select_customer') }} --</option>
            <option v-for="c in customers" :key="c.id" :value="c">
              {{ c.name }} ({{ c.phone }})
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('common.from') }}</label>
          <input type="date" class="form-control" v-model="fromDate" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('common.to') }}</label>
          <input type="date" class="form-control" v-model="toDate" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="generateStatement" :disabled="!selectedCustomer">
            {{ $t('reports.generate') }}
          </button>
          <button class="btn btn-secondary" @click="printStatement" :disabled="!statement.length">
            🖨️ {{ $t('reports.print_statement') }}
          </button>
        </div>
      </div>

      <div v-if="statement.length" class="table-container mt-20">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.timestamp') }}</th>
              <th>{{ $t('common.details') }}</th>
              <th class="text-right">{{ $t('reports.debit') }}</th>
              <th class="text-right">{{ $t('reports.credit') }}</th>
              <th class="text-right">{{ $t('common.balance') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in statement" :key="idx">
              <td>{{ new Date(row.date).toLocaleDateString() }}</td>
              <td>
                <span :class="['badge', row.type === 'Invoice' ? 'badge-warning' : 'badge-success']">
                  {{ row.type === 'Invoice' ? $t('reports.invoice') : $t('reports.payment') }}
                </span>
                <span class="ml-10 text-muted">{{ row.description }}</span>
              </td>
              <td class="text-right text-danger">{{ row.debit > 0 ? row.debit.toFixed(2) : "-" }}</td>
              <td class="text-right text-success">{{ row.credit > 0 ? row.credit.toFixed(2) : "-" }}</td>
              <td class="text-right font-bold">{{ $t('common.egp') }} {{ row.balance.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Summary totals for Statement -->
        <div class="statement-totals card">
          <div class="total-row">
            <span>{{ $t('reports.total_purchases') }}:</span>
            <span class="font-bold">{{ $t('common.egp') }} {{ totalPurchases.toFixed(2) }}</span>
          </div>
          <div class="total-row">
            <span>{{ $t('reports.total_payments') }}:</span>
            <span class="text-success font-bold">{{ $t('common.egp') }} {{ totalPayments.toFixed(2) }}</span>
          </div>
          <div class="total-row grand-total">
            <span>{{ $t('reports.final_balance') }}:</span>
            <span :class="['font-bold', remainingBalance > 0 ? 'text-danger' : 'text-success']">
              {{ $t('common.egp') }} {{ remainingBalance.toFixed(2) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Inventory Status Section -->
    <div class="card report-section">
      <div class="card-header">
        <h2 class="card-title">{{ $t('reports.stock_status') }}</h2>
      </div>
      <div class="report-filters">
        <div class="form-group">
          <label class="form-label">{{ $t('common.status') }}</label>
          <select class="form-control" v-model="inventoryReport.status">
            <option value="all">{{ $t('common.all') }}</option>
            <option value="out">{{ $t('inventory.out_of_stock') }}</option>
            <option value="expired">{{ $t('inventory.expired') }}</option>
            <option value="available">{{ $t('inventory.available') }}</option>
          </select>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="generateInventoryReport" :disabled="loading.inventory">
            {{ loading.inventory ? $t('reports.generating') : $t('reports.generate') }}
          </button>
          <button class="btn btn-secondary" @click="exportInventoryExcel" :disabled="!inventoryReport.data.length">
            📊 {{ $t('reports.export_excel') }}
          </button>
        </div>
      </div>

      <div v-if="filteredInventoryData.length" class="table-container mt-20">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.name') }}</th>
              <th class="text-center">{{ $t('inventory.stock') }}</th>
              <th class="text-center">{{ $t('common.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredInventoryData" :key="item.id">
              <td>{{ item.name }}</td>
              <td class="text-center font-bold">{{ item.stock }}</td>
              <td class="text-center">
                <span :class="['badge', (['Low Stock', 'Out of Stock', 'Expired'].includes(item.status)) ? 'badge-danger' : 'badge-success']">
                  {{ 
                    item.status === 'Out of Stock' ? $t('inventory.out_of_stock') : 
                    (item.status === 'Expired' ? $t('inventory.expired') : 
                    (item.status === 'Low Stock' ? $t('inventory.low_stock') : item.status)) 
                  }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. Product Performance Section -->
    <div class="card report-section">
      <div class="card-header">
        <h2 class="card-title">{{ $t('reports.performance') }}</h2>
      </div>
      <div class="report-filters">
        <div class="form-group">
          <label class="form-label">{{ $t('common.from') }}</label>
          <input type="date" class="form-control" v-model="performanceReport.filters.fromDate" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('common.to') }}</label>
          <input type="date" class="form-control" v-model="performanceReport.filters.toDate" />
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" @click="generatePerformanceReport" :disabled="loading.performance">
            {{ $t('reports.generate') }}
          </button>
          <button class="btn btn-secondary" @click="exportPerformanceExcel" :disabled="!performanceReport.data.length">
            📊 {{ $t('reports.export_excel') }}
          </button>
        </div>
      </div>

      <div v-if="performanceReport.data.length" class="table-container mt-20">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('products.name') }}</th>
              <th class="text-center">{{ $t('inventory.stock') }}</th>
              <th class="text-right">{{ $t('dashboard.revenue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in performanceReport.data" :key="item.name">
              <td class="font-bold">{{ item.name }}</td>
              <td class="text-center">{{ item.total_qty }}</td>
              <td class="text-right text-success font-bold">{{ $t('common.egp') }} {{ item.revenue.toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 5. Price List Section -->
    <div class="card report-section">
      <div class="card-header">
        <h2 class="card-title">{{ $t('reports.price_list') }}</h2>
      </div>
      <div class="report-filters">
        <button class="btn btn-primary" @click="generatePriceList" :disabled="loading.pricelist">
          {{ $t('reports.generate') }}
        </button>
        <button class="btn btn-secondary" @click="printPriceList" :disabled="!priceList.data.length">
          🖨️ {{ $t('common.print') }}
        </button>
        <button class="btn btn-secondary" @click="exportPriceListExcel" :disabled="!priceList.data.length">
          📊 {{ $t('reports.export_excel') }}
        </button>
      </div>

      <div v-if="priceList.data.length" class="table-container mt-20">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.name') }}</th>
              <th class="text-right">{{ $t('common.price') }}</th>
              <th class="text-center">{{ $t('common.unit') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in priceList.data" :key="item.name">
              <td class="font-bold">{{ item.name }}</td>
              <td class="text-right font-bold text-primary">{{ $t('common.egp') }} {{ item.price.toFixed(2) }}</td>
              <td class="text-center">{{ item.unit }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from "xlsx";

export default {
  data() {
    return {
      loading: {
        sales: false,
        inventory: false,
        performance: false,
        pricelist: false,
        statement: false,
      },
      customers: [],
      salesReport: {
        filters: { fromDate: "", toDate: "" },
        data: { summary: null, sales: [] },
      },
      inventoryReport: {
        status: "all",
        data: [],
      },
      performanceReport: {
        filters: { fromDate: "", toDate: "" },
        data: [],
      },
      priceList: {
        data: [],
      },
      selectedCustomer: null,
      fromDate: "",
      toDate: "",
      statement: [],
    };
  },

  mounted() {
    this.fetchCustomers();
  },

  computed: {
    totalPurchases() {
      return this.statement.reduce((sum, r) => sum + (r.debit || 0), 0);
    },
    totalPayments() {
      return this.statement.reduce((sum, r) => sum + (r.credit || 0), 0);
    },
    remainingBalance() {
      return this.statement.length > 0
        ? this.statement[this.statement.length - 1].balance
        : 0;
    },
    filteredInventoryData() {
      const today = new Date();
      return this.inventoryReport.data.filter((item) => {
        const isOut = item.stock <= 0;
        const isExpired =
          item.expire_date && new Date(item.expire_date) < today;

        if (this.inventoryReport.status === "out") return isOut;
        if (this.inventoryReport.status === "expired") return isExpired;
        if (this.inventoryReport.status === "available")
          return !isOut && !isExpired;
        return true;
      });
    },
  },

  methods: {
    async generateSalesReport() {
      this.loading.sales = true;
      try {
        const params = new URLSearchParams(this.salesReport.filters);
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reports/sales?${params.toString()}`);
        this.salesReport.data = await res.json();
      } catch (err) {
        console.error(err);
      } finally {
        this.loading.sales = false;
      }
    },

    exportSalesExcel() {
      const worksheet = XLSX.utils.json_to_sheet(this.salesReport.data.sales);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
      XLSX.writeFile(
        workbook,
        `Sales_Report_${new Date().toISOString().split("T")[0]}.xlsx`
      );
    },

    async generateInventoryReport() {
      this.loading.inventory = true;
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reports/inventory`);
        const data = await res.json();
        const today = new Date();
        this.inventoryReport.data = data.map((item) => {
          let status = item.status;
          if (item.expire_date && new Date(item.expire_date) < today)
            status = "Expired";
          else if (item.stock <= 0) status = "Out of Stock";
          return { ...item, status };
        });
      } catch (err) {
        console.error(err);
      } finally {
        this.loading.inventory = false;
      }
    },

    exportInventoryExcel() {
      const worksheet = XLSX.utils.json_to_sheet(this.inventoryReport.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
      XLSX.writeFile(workbook, "Inventory_Report.xlsx");
    },

    async generatePerformanceReport() {
      this.loading.performance = true;
      try {
        const params = new URLSearchParams(this.performanceReport.filters);
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reports/products?${params.toString()}`);
        this.performanceReport.data = await res.json();
      } catch (err) {
        console.error(err);
      } finally {
        this.loading.performance = false;
      }
    },

    exportPerformanceExcel() {
      const worksheet = XLSX.utils.json_to_sheet(this.performanceReport.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");
      XLSX.writeFile(workbook, "Product_Performance.xlsx");
    },

    async generatePriceList() {
      this.loading.pricelist = true;
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/reports/pricelist`);
        this.priceList.data = await res.json();
      } catch (err) {
        console.error(err);
      } finally {
        this.loading.pricelist = false;
      }
    },

    exportPriceListExcel() {
      const worksheet = XLSX.utils.json_to_sheet(this.priceList.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Price List");
      XLSX.writeFile(workbook, "Price_List.xlsx");
    },

    printPriceList() {
      const isRtl = document.documentElement.dir === 'rtl';
      const printWindow = window.open("", "", "width=800,height=600");
      const html = `
        <html dir="${isRtl ? 'rtl' : 'ltr'}">
          <head>
            <title>${this.$t('reports.price_list')}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; direction: ${isRtl ? 'rtl' : 'ltr'}; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: ${isRtl ? 'right' : 'left'}; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${this.$t('reports.price_list')}</h1>
              <p>${this.$t('common.timestamp')}: ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>${this.$t('common.name')}</th>
                  <th>${this.$t('common.price')}</th>
                  <th>${this.$t('common.unit')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.priceList.data.map(i => `
                  <tr>
                    <td>${i.name}</td>
                    <td>${i.price.toFixed(2)} ${this.$t('common.egp')}</td>
                    <td>${i.unit}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    },

    async fetchCustomers() {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/customers`);
        const data = await res.json();
        this.customers = data;
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    },

    async generateStatement() {
      try {
        const res = await fetch(
          `${process.env.VUE_APP_API_URL}/reports/customer-statement?phone=${this.selectedCustomer.phone}&fromDate=${this.fromDate}&toDate=${this.toDate}`
        );
        const data = await res.json();
        this.statement = data;
      } catch (err) {
        console.error(err);
      }
    },

    printStatement() {
      const isRtl = document.documentElement.dir === 'rtl';
      const printWindow = window.open("", "", "width=900,height=700");
      const customer = this.selectedCustomer;

      printWindow.document.write(`
        <html dir="${isRtl ? 'rtl' : 'ltr'}">
          <head>
            <title>${this.$t('reports.statement')} - ${customer?.name}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; direction: ${isRtl ? 'rtl' : 'ltr'}; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2c3e50; padding-bottom: 15px; margin-bottom: 20px; }
              .brand h1 { margin: 0; color: #2c3e50; font-size: 24px; }
              .brand p { margin: 5px 0; color: #7f8c8d; font-size: 14px; }
              .info { text-align: ${isRtl ? 'left' : 'right'}; }
              .customer-box { background: #f8f9fa; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
              .customer-box h3 { margin: 0 0 10px 0; font-size: 18px; color: #2c3e50; }
              .customer-box p { margin: 4px 0; font-size: 14px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #dee2e6; padding: 12px 10px; text-align: ${isRtl ? 'right' : 'left'}; font-size: 13px; }
              th { background-color: #2c3e50; color: white; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; }
              .text-danger { color: #e74c3c; font-weight: bold; }
              .text-success { color: #27ae60; font-weight: bold; }
              .summary-section { margin-top: 30px; display: flex; justify-content: ${isRtl ? 'flex-start' : 'flex-end'}; }
              .summary-table { width: 300px; }
              .summary-table td { border: none; padding: 5px 0; }
              .summary-table .total-row td { border-top: 2px solid #2c3e50; padding-top: 10px; font-weight: bold; font-size: 16px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="brand">
                <h1>${this.$t('common.app_name')}</h1>
                <p>${isRtl ? 'بذور وأسمدة عالية الجودة' : 'High Quality Seeds & Fertilizers'}</p>
              </div>
              <div class="info">
                <h2>${this.$t('reports.statement')}</h2>
                <p>${this.$t('common.date')}: ${new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div class="customer-box">
              <h3>${isRtl ? 'بيانات العميل' : 'Customer Information'}</h3>
              <p><strong>${this.$t('common.name')}:</strong> ${customer?.name}</p>
              <p><strong>${this.$t('common.phone')}:</strong> ${customer?.phone}</p>
              <p><strong>${isRtl ? 'الفترة' : 'Period'}:</strong> ${this.fromDate || (isRtl ? "البداية" : "All Time")} ${this.$t('common.to')} ${this.toDate || (isRtl ? "الآن" : "Present")}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>${this.$t('common.date')}</th>
                  <th>${this.$t('common.details')}</th>
                  <th>${this.$t('reports.debit')}</th>
                  <th>${this.$t('reports.credit')}</th>
                  <th>${this.$t('common.balance')}</th>
                </tr>
              </thead>
              <tbody>
                ${this.statement.map(row => `
                  <tr>
                    <td>${new Date(row.date).toLocaleDateString()}</td>
                    <td>${row.type === 'Invoice' ? this.$t('reports.invoice') : this.$t('reports.payment')} - ${row.description}</td>
                    <td class="text-danger">${row.debit > 0 ? row.debit.toFixed(2) : "-"}</td>
                    <td class="text-success">${row.credit > 0 ? row.credit.toFixed(2) : "-"}</td>
                    <td style="font-weight: bold">${row.balance.toFixed(2)} ${this.$t('common.egp')}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="summary-section">
              <table class="summary-table">
                <tr>
                  <td>${this.$t('reports.total_purchases')}:</td>
                  <td style="text-align: ${isRtl ? 'left' : 'right'}">${this.totalPurchases.toFixed(2)} ${this.$t('common.egp')}</td>
                </tr>
                <tr>
                  <td class="text-success">${this.$t('reports.total_payments')}:</td>
                  <td style="text-align: ${isRtl ? 'left' : 'right'}" class="text-success">${this.totalPayments.toFixed(2)} ${this.$t('common.egp')}</td>
                </tr>
                <tr class="total-row">
                  <td>${this.$t('reports.final_balance')}:</td>
                  <td style="text-align: ${isRtl ? 'left' : 'right'}" class="${this.remainingBalance > 0 ? "text-danger" : "text-success"}">
                    ${this.remainingBalance.toFixed(2)} ${this.$t('common.egp')}
                  </td>
                </tr>
              </table>
            </div>
            <div style="margin-top: 60px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; color: #7f8c8d; font-size: 12px;">
              <p>${isRtl ? 'تم استخراج هذا البيان آلياً ولا يتطلب توقيعاً.' : 'This is a computer-generated statement and does not require a physical signature.'}</p>
            </div>
            <script>
              window.onload = () => { window.print(); window.close(); };
            <\/script>
          </body>
        </html>
      `);
      printWindow.document.close();
    },
  },
};
</script>

<style scoped>
.reports-page { padding-bottom: 40px; }
.report-section { margin-bottom: 24px; padding: 0; }
.report-section .card-header { padding: 20px 24px; border-bottom: 1px solid var(--border-color); }

.report-filters {
  padding: 20px 24px;
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
  background: var(--bg-muted);
}
.report-filters .form-group { margin-bottom: 0; flex: 1; min-width: 200px; }

.filter-actions { display: flex; gap: 12px; }

.report-summary-stats { padding: 20px 24px; border-top: 1px solid var(--border-color); }
.stats-grid.mini .stat-card { padding: 16px; min-width: 150px; text-align: center; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
.stats-grid.mini .stat-value { font-size: 1.25rem; font-weight: bold; }
.stat-label { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; }

.table-container { overflow-x: auto; padding: 0 24px 24px; }
.mt-20 { margin-top: 20px; }
.ml-10 { margin-left: 10px; }
[dir="rtl"] .ml-10 { margin-left: 0; margin-right: 10px; }

.statement-totals {
  margin-top: 24px;
  margin-inline-start: auto;
  max-width: 400px;
  padding: 20px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.95rem;
}

.total-row.grand-total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 2px solid var(--border-color);
  font-size: 1.2rem;
  color: var(--text-main);
}

.badge-warning { background: #fffbeb; color: #92400e; }
.badge-success { background: #f0fdf4; color: #166534; }
.badge-danger { background: #fef2f2; color: #991b1b; }

@media (max-width: 768px) {
  .report-filters { flex-direction: column; align-items: stretch; }
  .filter-actions { flex-direction: column; }
}
</style>
