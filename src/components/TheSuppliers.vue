<template>
  <div class="main-content">
    <div id="page-content" class="page-content">
      <div class="suppliers-page">
        <div class="sup-page-header">
          <h1 class="page-title">{{ $t('suppliers.payable') }}</h1>
          <button class="btn btn-primary" @click="showAddSupplierModal = true">
            {{ $t('suppliers.add') }}
          </button>
        </div>

        <!--  TOTAL OVERVIEW (Quick Stats) -->
        <div class="mini-stats">
          <div class="stat-card">
            <div class="stat-label">{{ $t('suppliers.owed') }}</div>
            <div class="stat-value text-danger">
              {{ $t('common.egp') }} {{ totalOwed.toFixed(2) }}
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">{{ $t('suppliers.with_balance') }}</div>
            <div class="stat-value">{{ suppliersInDebt.length }}</div>
          </div>
        </div>

        <div class="card">
          <div class="search-bar">
            <input
              type="text"
              class="form-control"
              :placeholder="$t('common.search_placeholder')"
              v-model="searchQuery"
            />
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ $t('common.name') }}</th>
                  <th>{{ $t('suppliers.contact') }}</th>
                  <th>{{ $t('suppliers.orders') }}</th>
                  <th>{{ $t('suppliers.paid_amount') }} 💰</th>
                  <th>{{ $t('suppliers.balance') }}</th>
                  <th>{{ $t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="filteredSuppliers.length === 0">
                  <td colspan="6" style="text-align: center; padding: 30px">
                    {{ $t('common.no_records') }}
                  </td>
                </tr>
                <tr v-for="sup in filteredSuppliers" :key="sup.id">
                  <td style="font-weight: 500">{{ sup.name }}</td>
                  <td>
                    <div>{{ sup.phone }}</div>
                    <small style="color: #666">{{ sup.address }}</small>
                  </td>
                  <td>{{ $t('common.egp') }} {{ sup.total_purchases.toFixed(2) }}</td>
                  <td style="color: #2ecc71">
                    {{ $t('common.egp') }} {{ sup.total_paid.toFixed(2) }}
                  </td>
                  <td
                    :style="{
                      color: sup.remaining_balance > 0 ? '#e74c3c' : 'inherit',
                      fontWeight: sup.remaining_balance > 0 ? 'bold' : 'normal',
                    }"
                  >
                    {{ $t('common.egp') }} {{ sup.remaining_balance.toFixed(2) }}
                  </td>
                  <td class="table-actions">
                    <button
                      class="btn btn-sm btn-success"
                      @click="openPayModal(sup)"
                      :disabled="sup.remaining_balance <= 0"
                    >
                      {{ $t('suppliers.pay') }}
                    </button>
                    <button
                      class="btn-icon"
                      @click="viewHistory(sup)"
                      :title="$t('suppliers.history')"
                    >
                      📜
                    </button>
                    <button
                      class="btn-icon"
                      @click="editSupplier(sup)"
                      :title="$t('common.edit')"
                    >
                      ✏️
                    </button>
                    <button
                      class="btn-icon"
                      @click="deleteSupplier(sup.id)"
                      :title="$t('common.delete')"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Add/Edit Supplier -->
    <div v-if="showAddSupplierModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h2>{{ currentSupplier.id ? $t('common.edit') : $t('common.add') }} {{ $t('suppliers.title') }}</h2>
          <button class="close-btn" @click="closeSupplierModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>{{ $t('common.name') }} *</label>
            <input
              type="text"
              v-model="currentSupplier.name"
              :placeholder="$t('common.name')"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('common.phone') }}</label>
            <input
              type="text"
              v-model="currentSupplier.phone"
              placeholder="01..."
            />
          </div>
          <div class="form-group">
            <label>{{ $t('suppliers.address') }}</label>
            <input
              type="text"
              v-model="currentSupplier.address"
              placeholder="Location"
            />
          </div>
          <div class="form-group" v-if="!currentSupplier.id">
            <label>{{ $t('suppliers.initial_debt') }} (optional)</label>
            <input
              type="number"
              v-model.number="currentSupplier.initial_debt"
              placeholder="0.00"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="saveSupplier">
            {{ $t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Pay Supplier -->
    <div v-if="showPayModal" class="modal-overlay">
      <div class="modal-card mini-modal">
        <div class="modal-header">
          <h2>{{ $t('suppliers.pay') }} {{ selectedSupplier.name }}</h2>
          <button class="close-btn" @click="showPayModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div
            style="
              background: #f8f9fa;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 15px;
            "
          >
            <div style="display: flex; justify-content: space-between">
              <span>{{ $t('suppliers.balance') }}:</span>
              <strong style="color: #e74c3c"
                >{{ $t('common.egp') }} {{ selectedSupplier.remaining_balance.toFixed(2) }}</strong
              >
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('customers.payment_amount') }} *</label>
            <input
              type="number"
              v-model.number="payAmount"
              :max="selectedSupplier.remaining_balance"
              placeholder="0.00"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('common.notes') }} / {{ $t('common.timestamp') }}</label>
            <input
              type="text"
              v-model="payNote"
              placeholder="e.g. Bank Transfer"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button
            class="btn btn-primary btn-block"
            @click="processPayment"
            :disabled="!payAmount || payAmount <= 0"
          >
            {{ $t('customers.confirm_payment') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Payment History -->
    <div v-if="showHistoryModal" class="modal-overlay">
      <div class="modal-card wide-modal">
        <div class="modal-header">
          <h2>{{ $t('suppliers.history') }}: {{ selectedSupplier.name }}</h2>
          <button class="close-btn" @click="showHistoryModal = false">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <table class="table mini-table">
            <thead>
              <tr>
                <th>{{ $t('common.date') }}</th>
                <th>{{ $t('common.amount') }}</th>
                <th>{{ $t('common.notes') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="paymentHistory.length === 0">
                <td colspan="3" style="text-align: center">
                  {{ $t('common.no_records') }}
                </td>
              </tr>
              <tr v-for="pay in paymentHistory" :key="pay.id">
                <td>{{ formatDate(pay.date) }}</td>
                <td style="color: #2ecc71; font-weight: bold">
                  {{ $t('common.egp') }} {{ pay.amount.toFixed(2) }}
                </td>
                <td>{{ pay.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      suppliers: [],
      searchQuery: "",
      showAddSupplierModal: false,
      showPayModal: false,
      showHistoryModal: false,
      currentSupplier: {
        id: null,
        name: "",
        phone: "",
        address: "",
        initial_debt: 0,
      },
      selectedSupplier: null,
      payAmount: 0,
      payNote: "",
      paymentHistory: [],
    };
  },

  computed: {
    filteredSuppliers() {
      return this.suppliers.filter(
        (s) =>
          !this.searchQuery ||
          s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          s.phone.includes(this.searchQuery)
      );
    },
    totalOwed() {
      return this.suppliers.reduce((sum, s) => sum + s.remaining_balance, 0);
    },
    suppliersInDebt() {
      return this.suppliers.filter((s) => s.remaining_balance > 0);
    },
  },

  mounted() {
    this.fetchSuppliers();
  },

  methods: {
    async fetchSuppliers() {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/suppliers`);
        this.suppliers = await res.json();
      } catch (err) {
        console.error(err);
      }
    },

    async saveSupplier() {
      if (!this.currentSupplier.name) return alert(this.$t('suppliers.name_req'));
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/suppliers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(this.currentSupplier),
        });
        if (res.ok) {
          this.closeSupplierModal();
          this.fetchSuppliers();
        }
      } catch (err) {
        console.error(err);
      }
    },

    async processPayment() {
      if (this.payAmount > this.selectedSupplier.remaining_balance) {
        alert(this.$t('suppliers.debt_warning'));
        return;
      }
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/suppliers/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplier_id: this.selectedSupplier.id,
            amount: this.payAmount,
            note: this.payNote,
          }),
        });
        if (res.ok) {
          this.showPayModal = false;
          this.fetchSuppliers();
        }
      } catch (err) {
        console.error(err);
      }
    },

    async viewHistory(supplier) {
      this.selectedSupplier = supplier;
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/suppliers/${supplier.id}/payments`);
        this.paymentHistory = await res.json();
        this.showHistoryModal = true;
      } catch (err) {
        console.error(err);
      }
    },

    async deleteSupplier(id) {
      if (!confirm(this.$t('common.delete') + "?")) return;
      try {
        await fetch(`${process.env.VUE_APP_API_URL}/suppliers/${id}`, { method: "DELETE" });
        this.fetchSuppliers();
      } catch (err) {
        console.error(err);
      }
    },

    openPayModal(supplier) {
      this.selectedSupplier = supplier;
      this.payAmount = supplier.remaining_balance;
      this.payNote = "";
      this.showPayModal = true;
    },

    editSupplier(supplier) {
      this.currentSupplier = { ...supplier };
      this.showAddSupplierModal = true;
    },

    closeSupplierModal() {
      this.showAddSupplierModal = false;
      this.currentSupplier = {
        id: null,
        name: "",
        phone: "",
        address: "",
        initial_debt: 0,
      };
    },

    formatDate(date) {
      return new Date(date).toLocaleString();
    },
  },
};
</script>

<style scoped>
.sup-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.mini-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.search-bar { margin-bottom: 14px; }

.stat-card {
  background: white;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  text-align: center;
  min-width: 0;
}
.stat-label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-bottom: 4px; }
.stat-value { font-size: 1.2rem; font-weight: 800; }
.text-danger { color: var(--danger); }

.table-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.btn-icon {
  background: none;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 5px 8px;
  cursor: pointer;
  font-size: 1rem;
  min-width: 34px;
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.btn-icon:hover { background: var(--bg-muted); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 16px;
}
.modal-card {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-lg);
}
.mini-modal { max-width: 380px; }
.wide-modal  { max-width: 660px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  margin-bottom: 16px;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 4px;
  min-width: 32px;
  min-height: 32px;
}

.modal-footer {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-block { width: 100%; }
.mini-table { font-size: 0.88rem; }

@media (max-width: 768px) {
  .sup-page-header { flex-direction: column; align-items: stretch; }
  .sup-page-header .btn { width: 100%; }
  .mini-stats { grid-template-columns: 1fr 1fr; }
  .table-actions { flex-wrap: nowrap; }
  .modal-footer { justify-content: stretch; }
  .modal-footer .btn { flex: 1; }
}

@media (max-width: 480px) {
  .mini-stats { grid-template-columns: 1fr; }
}
</style>
