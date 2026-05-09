<template>
  <main class="main-content">
    <div class="page-content">
      <div class="purchases-page">
        <div class="purchases-header">
          <h1 class="page-title">{{ $t('purchases.title') }}</h1>
          <div class="totals-summary" v-if="totals">
            <div class="summary-item">
              <span class="sum-label">{{ $t('common.total') }}</span>
              <span class="sum-value">{{ $t('common.egp') }} {{ totals.total.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="sum-label">{{ $t('common.paid') }}</span>
              <span class="sum-value text-success">{{ $t('common.egp') }} {{ totals.paid.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="sum-label">{{ $t('common.remaining') }}</span>
              <span class="sum-value text-danger">{{ $t('common.egp') }} {{ totals.remaining.toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="card">
          <!--  Filters -->
          <div class="filters-grid">
            <div class="filter-group">
              <label class="form-label">{{ $t('sales.customer') }}</label>
              <input
                type="text"
                class="form-control"
                :placeholder="$t('common.name') + ' / ' + $t('common.phone')"
                v-model="filters.search"
                @input="debouncedFetch"
              />
            </div>
            <div class="filter-group">
              <label class="form-label">{{ $t('common.status') }}</label>
              <select class="form-control" v-model="filters.status" @change="fetchPurchases">
                <option value="all">{{ $t('purchases.any_status') }}</option>
                <option value="PAID">{{ $t('common.paid') }}</option>
                <option value="PARTIALLY PAID">{{ $t('common.status') }} ({{ $t('common.remaining') }})</option>
                <option value="UNPAID">{{ $t('common.remaining') }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="form-label">{{ $t('common.from') }}</label>
              <input type="date" class="form-control" v-model="filters.fromDate" @change="fetchPurchases" />
            </div>
            <div class="filter-group">
              <label class="form-label">{{ $t('common.to') }}</label>
              <input type="date" class="form-control" v-model="filters.toDate" @change="fetchPurchases" />
            </div>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ $t('purchases.invoice_id') }}</th>
                  <th>{{ $t('sales.customer') }}</th>
                  <th>{{ $t('common.total') }}</th>
                  <th>{{ $t('common.paid') }}</th>
                  <th>{{ $t('common.remaining') }}</th>
                  <th>{{ $t('common.date') }}</th>
                  <th>{{ $t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="purchases.length === 0">
                  <td colspan="7" class="text-center">{{ $t('common.no_records') }}</td>
                </tr>
                <tr v-for="sale in purchases" :key="sale.id">
                  <td><span class="badge badge-secondary">#{{ sale.id }}</span></td>
                  <td class="font-bold">{{ sale.customer_name }}</td>
                  <td>{{ $t('common.egp') }} {{ sale.total.toFixed(2) }}</td>
                  <td class="text-success font-bold">{{ $t('common.egp') }} {{ sale.paid.toFixed(2) }}</td>
                  <td :class="sale.remaining > 0 ? 'text-danger font-bold' : 'text-muted'">
                    {{ $t('common.egp') }} {{ sale.remaining.toFixed(2) }}
                  </td>
                  <td class="text-muted">{{ formatDate(sale.date) }}</td>
                  <td class="table-actions">
                    <button class="btn-icon" @click="viewInvoice(sale.id)" :title="$t('common.view')">👁️</button>
                    <button class="btn-icon" @click="printInvoice(sale.id)" :title="$t('common.print')">🖨️</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card invoice-modal">
        <div class="modal-header">
          <h2>{{ $t('purchases.invoice_details') }} #{{ currentInvoice.sale.id }}</h2>
          <button class="close-btn" @click="showModal = false">&times;</button>
        </div>

        <div class="modal-body" v-if="currentInvoice">
          <div class="invoice-info">
            <div><strong>{{ $t('sales.customer') }}:</strong> {{ currentInvoice.sale.customer_name }}</div>
            <div><strong>{{ $t('common.date') }}:</strong> {{ formatDate(currentInvoice.sale.date) }}</div>
          </div>

          <table class="table mini-table">
            <thead>
              <tr>
                <th>{{ $t('common.name') }}</th>
                <th>{{ $t('sales.qty') }}</th>
                <th>{{ $t('sales.price') }}</th>
                <th>{{ $t('sales.subtotal') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in currentInvoice.items" :key="item.id">
                <td>{{ item.product_name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ item.price.toFixed(2) }}</td>
                <td>{{ (item.quantity * item.price).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="invoice-summary">
            <div class="inv-line">
              <span>{{ $t('common.total') }}:</span>
              <strong>{{ $t('common.egp') }} {{ currentInvoice.sale.total.toFixed(2) }}</strong>
            </div>
            <div class="inv-line text-success">
              <span>{{ $t('common.paid') }}:</span>
              <strong>{{ $t('common.egp') }} {{ currentInvoice.sale.paid.toFixed(2) }}</strong>
            </div>
            <div class="inv-line text-danger font-bold">
              <span>{{ $t('common.remaining') }}:</span>
              <strong>{{ $t('common.egp') }} {{ currentInvoice.sale.remaining.toFixed(2) }}</strong>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            class="btn btn-primary"
            @click="printInvoice(currentInvoice.sale.id)"
          >
            {{ $t('common.print') }}
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      purchases: [],
      totals: null,
      filters: {
        search: "",
        fromDate: "",
        toDate: "",
        status: "all",
      },
      debounceTimeout: null,
      showModal: false,
      currentInvoice: null,
    };
  },

  mounted() {
    this.fetchPurchases();
  },

  methods: {
    debouncedFetch() {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = setTimeout(() => {
        this.fetchPurchases();
      }, 500);
    },

    async fetchPurchases() {
      try {
        const params = new URLSearchParams(this.filters);
        const res = await fetch(`${process.env.VUE_APP_API_URL}/purchases?${params.toString()}`);
        const data = await res.json();
        this.purchases = data.sales;
        this.totals = data.totals;
      } catch (err) {
        console.error("Error fetching purchases:", err);
      }
    },

    async viewInvoice(id) {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/purchases/${id}`);
        this.currentInvoice = await res.json();
        this.showModal = true;
      } catch (err) {
        console.error(err);
      }
    },

    async printInvoice(id) {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/purchases/${id}`);
        const data = await res.json();
        const isRtl = document.documentElement.getAttribute("dir") === "rtl";
        const storeName = localStorage.getItem('store_name') || this.$t('common.app_name');

        const printWindow = window.open("", "", "width=500,height=700");
        const html = `
          <html dir="${isRtl ? 'rtl' : 'ltr'}">
            <head>
              <title>${this.$t('purchases.invoice_id')} #${data.sale.id}</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #333; direction: ${isRtl ? 'rtl' : 'ltr'}; }
                .header { text-align: center; margin-bottom: 20px; }
                .store-name { font-size: 24px; font-weight: 800; margin-bottom: 5px; color: #1e293b; }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: ${isRtl ? 'right' : 'left'}; }
                .summary { margin-top: 15px; text-align: ${isRtl ? 'left' : 'right'}; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: gray; }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="store-name">🌾 ${storeName}</div>
                <p>${this.$t('purchases.invoice_id')} #${data.sale.id}</p>
              </div>
              <div class="info">class="info">
                <div><strong>${this.$t('sales.customer')}:</strong> ${data.sale.customer_name}</div>
                <div><strong>${this.$t('common.date')}:</strong> ${this.formatDate(data.sale.date)}</div>
              </div>
              <div class="line"></div>
              <table>
                <thead>
                  <tr>
                    <th>${this.$t('common.name')}</th>
                    <th>${this.$t('sales.qty')}</th>
                    <th>${this.$t('sales.price')}</th>
                    <th>${this.$t('sales.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.items.map(i => `
                    <tr>
                      <td>${i.product_name}</td>
                      <td>${i.quantity}</td>
                      <td>${i.price.toFixed(2)}</td>
                      <td>${(i.quantity * i.price).toFixed(2)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <div class="summary">
                <div>${this.$t('common.total')}: <strong>${data.sale.total.toFixed(2)} ${this.$t('common.egp')}</strong></div>
                <div>${this.$t('common.paid')}: <strong>${data.sale.paid.toFixed(2)} ${this.$t('common.egp')}</strong></div>
                <div style="color: red">${this.$t('common.remaining')}: <strong>${data.sale.remaining.toFixed(2)} ${this.$t('common.egp')}</strong></div>
              </div>
              <div class="footer">${isRtl ? 'شكراً لتعاملكم معنا!' : 'Thank you for your business!'}</div>
            </body>
          </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      } catch (err) {
        console.error(err);
      }
    },

    formatDate(date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleString();
    },
  },
};
</script>

<style scoped>
/* ── Page header ──────────────────────────────── */
.purchases-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 16px;
}

.totals-summary {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-width: 0;
}
.sum-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; white-space: nowrap; }
.sum-value  { font-size: 1rem;   font-weight: 800; white-space: nowrap; }

/* ── Filters ──────────────────────────────────── */
.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr));
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
}

/* ── Table utilities ──────────────────────────── */
.text-success { color: var(--success); }
.text-danger  { color: var(--danger); }
.text-muted   { color: var(--text-muted); }
.font-bold    { font-weight: 700; }
.text-center  { text-align: center; }
.table-actions { display: flex; gap: 6px; }

.btn-icon {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  cursor: pointer;
  padding: 5px 8px;
  min-width: 34px;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover { background: var(--bg-muted); }

/* ── Invoice modal ────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
}
.modal-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 580px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.close-btn {
  background: none; border: none; font-size: 1.5rem; cursor: pointer;
  min-width: 34px; min-height: 34px;
}
.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}
.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* ── Invoice view ─────────────────────────────── */
.invoice-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
}

.invoice-summary {
  margin-top: 16px;
  border-top: 2px solid var(--border-color);
  padding-top: 12px;
}
.inv-line {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 0.95rem;
}

.mini-table th { background: var(--bg-muted); font-size: 0.88rem; }
.mini-table td { font-size: 0.88rem; }

/* ── Badge ────────────────────────────────────── */
.badge { padding: 4px 8px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 700; }
.badge-secondary { background: var(--bg-muted); color: var(--text-muted); }

/* ── Responsive ───────────────────────────────── */
@media (max-width: 768px) {
  .purchases-header { flex-direction: column; }
  .totals-summary { gap: 10px; justify-content: flex-start; }
  .summary-item { align-items: flex-start; }
  .invoice-info { grid-template-columns: 1fr; }
  .filters-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 480px) {
  .filters-grid { grid-template-columns: 1fr; }
  .modal-footer { justify-content: stretch; }
  .modal-footer .btn { flex: 1; }
}
</style>
