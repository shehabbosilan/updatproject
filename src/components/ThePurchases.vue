<template>
  <main class="main-content">
    <div class="page-content">
      <div class="purchases-page">
        <div
          class="card-header"
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          "
        >
          <h1 class="page-title">{{ $t('purchases.title') }}</h1>
          <div
            class="totals-summary"
            v-if="totals"
            style="display: flex; gap: 20px"
          >
            <div class="summary-item">
              <span class="label">{{ $t('common.total') }}:</span>
              <span class="value">{{ $t('common.egp') }} {{ totals.total.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">{{ $t('common.paid') }}:</span>
              <span class="value" style="color: #2ecc71"
                >{{ $t('common.egp') }} {{ totals.paid.toFixed(2) }}</span
              >
            </div>
            <div class="summary-item">
              <span class="label">{{ $t('common.remaining') }}:</span>
              <span class="value" style="color: #e74c3c"
                >{{ $t('common.egp') }} {{ totals.remaining.toFixed(2) }}</span
              >
            </div>
          </div>
        </div>

        <div class="card">
          <!--  Filters -->
          <div
            class="filters-grid"
            style="
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
              padding: 15px;
              background: #f8f9fa;
              border-radius: 8px;
            "
          >
            <div class="filter-group">
              <label>{{ $t('sales.customer') }}</label>
              <input
                type="text"
                :placeholder="$t('common.name') + ' / ' + $t('common.phone')"
                v-model="filters.search"
                @input="debouncedFetch"
                style="
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                "
              />
            </div>
            <div class="filter-group">
              <label>{{ $t('common.status') }}</label>
              <select
                v-model="filters.status"
                @change="fetchPurchases"
                style="
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                "
              >
                <option value="all">{{ $t('purchases.any_status') }}</option>
                <option value="PAID">{{ $t('common.paid') }}</option>
                <option value="PARTIALLY PAID">{{ $t('common.status') }} ({{ $t('common.remaining') }})</option>
                <option value="UNPAID">{{ $t('common.remaining') }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>{{ $t('common.from') }}</label>
              <input
                type="date"
                v-model="filters.fromDate"
                @change="fetchPurchases"
                style="
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                "
              />
            </div>
            <div class="filter-group">
              <label>{{ $t('common.to') }}</label>
              <input
                type="date"
                v-model="filters.toDate"
                @change="fetchPurchases"
                style="
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                "
              />
            </div>
          </div>

          <!--  Table -->
          <div class="table-container">
            <table class="table">
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
                  <td colspan="8" style="text-align: center; padding: 30px">
                    {{ $t('common.no_records') }}
                  </td>
                </tr>

                <tr v-for="sale in purchases" :key="sale.id">
                  <td>#{{ sale.id }}</td>
                  <td>{{ sale.customer_name }}</td>
                  <td>{{ $t('common.egp') }} {{ sale.total.toFixed(2) }}</td>
                  <td style="color: #2ecc71">{{ $t('common.egp') }} {{ sale.paid.toFixed(2) }}</td>
                  <td
                    :style="{
                      color: sale.remaining > 0 ? '#e74c3c' : 'inherit',
                      fontWeight: sale.remaining > 0 ? 'bold' : 'normal',
                    }"
                  >
                    {{ $t('common.egp') }} {{ sale.remaining.toFixed(2) }}
                  </td>

                  <td>{{ formatDate(sale.date) }}</td>
                  <td class="table-actions">
                    <button
                      class="btn-icon"
                      @click="viewInvoice(sale.id)"
                      :title="$t('common.view')"
                    >
                      👁️
                    </button>
                    <button
                      class="btn-icon"
                      @click="printInvoice(sale.id)"
                      :title="$t('common.print')"
                    >
                      🖨️
                    </button>
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
          <div
            class="invoice-info"
            style="
              margin-bottom: 20px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            "
          >
            <div>
              <strong>{{ $t('sales.customer') }}:</strong> {{ currentInvoice.sale.customer_name }}
            </div>
            <div>
              <strong>{{ $t('common.date') }}:</strong> {{ formatDate(currentInvoice.sale.date) }}
            </div>
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

          <div
            class="invoice-summary"
            style="
              margin-top: 20px;
              border-top: 2px solid #eee;
              padding-top: 15px;
            "
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
              "
            >
              <span>{{ $t('common.total') }}:</span>
              <strong>{{ $t('common.egp') }} {{ currentInvoice.sale.total.toFixed(2) }}</strong>
            </div>
            <div
              style="
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                color: #2ecc71;
              "
            >
              <span>{{ $t('common.paid') }}:</span>
              <strong>{{ $t('common.egp') }} {{ currentInvoice.sale.paid.toFixed(2) }}</strong>
            </div>
            <div
              style="
                display: flex;
                justify-content: space-between;
                color: #e74c3c;
                font-weight: bold;
              "
            >
              <span>{{ $t('common.remaining') }}:</span>
              <strong
                >{{ $t('common.egp') }} {{ currentInvoice.sale.remaining.toFixed(2) }}</strong
              >
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

        const printWindow = window.open("", "", "width=500,height=700");
        const html = `
          <html>
            <head>
              <title>${this.$t('purchases.invoice_id')} #${data.sale.id}</title>
              <style>
                body { font-family: Arial; padding: 20px; color: #333; direction: ${isRtl ? 'rtl' : 'ltr'}; }
                .header { text-align: center; margin-bottom: 20px; }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: ${isRtl ? 'right' : 'left'}; }
                .summary { margin-top: 15px; text-align: ${isRtl ? 'left' : 'right'}; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: gray; }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>🌾 ${this.$t('common.app_name')}</h2>
                <p>${this.$t('purchases.invoice_id')} #${data.sale.id}</p>
              </div>
              <div class="info">
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
.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75em;
  font-weight: bold;
}
.badge-success {
  background: #dcfce7;
  color: #22c55e;
}
.badge-warning {
  background: #fef3c7;
  color: #92400e;
}
.badge-danger {
  background: #fee2e2;
  color: #ef4444;
}

.totals-summary .summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.totals-summary .label {
  font-size: 0.8em;
  color: #666;
}
.totals-summary .value {
  font-size: 1.1em;
  font-weight: bold;
}

.filter-group label {
  display: block;
  font-size: 0.85em;
  color: #555;
  margin-bottom: 4px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.invoice-modal {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
  padding-bottom: 10px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5em;
  cursor: pointer;
}
.mini-table th {
  background: #f8f9fa;
  font-size: 0.9em;
}
.mini-table td {
  font-size: 0.9em;
}
.modal-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.2em;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
}
.btn-icon:hover {
  background: #eee;
}
</style>
