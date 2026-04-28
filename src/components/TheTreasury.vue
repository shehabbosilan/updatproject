<template>
  <div class="treasury-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ $t('treasury.title') }}</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-success" @click="openModal('IN')">
          <span>➕</span> {{ $t('dashboard.add_money') }}
        </button>
        <button class="btn btn-danger" @click="openModal('OUT')">
          <span>➖</span> {{ $t('dashboard.withdraw_money') }}
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon">💰</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.liquidity') }}</div>
          <div class="stat-value">{{ $t('common.egp') }} {{ stats.current_balance.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon">↗</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.inflows') }}</div>
          <div class="stat-value text-success">{{ $t('common.egp') }} {{ stats.total_in.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon">↘</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.outflows') }}</div>
          <div class="stat-value text-danger">{{ $t('common.egp') }} {{ stats.total_out.toLocaleString(undefined, {minimumFractionDigits: 2}) }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filters-card">
      <div class="search-box">
        <input type="text" v-model="filters.search" :placeholder="$t('common.search_placeholder')" class="form-control" @input="fetchTreasury" />
      </div>
      <div class="filters-row">
        <div class="filter-group">
          <label class="form-label">{{ $t('dashboard.direction') }}</label>
          <select v-model="filters.type" @change="fetchTreasury" class="form-control">
            <option value="ALL">{{ $t('dashboard.all_flows') }}</option>
            <option value="IN">{{ $t('dashboard.inflow') }}</option>
            <option value="OUT">{{ $t('dashboard.outflow') }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="form-label">{{ $t('dashboard.date_range') }}</label>
          <div class="date-range">
            <input type="date" v-model="filters.fromDate" @change="fetchTreasury" class="form-control" />
            <span>{{ $t('common.to') }}</span>
            <input type="date" v-model="filters.toDate" @change="fetchTreasury" class="form-control" />
          </div>
        </div>
      </div>
    </div>

    <!-- Ledger Table -->
    <div class="card table-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.timestamp') }}</th>
              <th>{{ $t('dashboard.direction') }}</th>
              <th>{{ $t('common.details') }}</th>
              <th class="text-right">{{ $t('common.amount') }}</th>
              <th class="text-right">{{ $t('common.balance') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="transactions.length === 0">
              <td colspan="5" class="text-center">{{ $t('common.no_records') }}</td>
            </tr>
            <tr v-for="t in transactions" :key="t.id">
              <td>
                <div class="font-bold">{{ new Date(t.date).toLocaleDateString() }}</div>
                <div class="text-muted text-xs">{{ new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</div>
              </td>
              <td>
                <span :class="['badge', t.type === 'IN' ? 'badge-success' : 'badge-danger']">
                  {{ t.type === 'IN' ? $t('dashboard.inflow') : $t('dashboard.outflow') }}
                </span>
              </td>
              <td>
                <div class="font-semibold">{{ t.description }}</div>
                <div class="text-muted text-xs">{{ $t('dashboard.reference') }}: {{ t.reference_id }}</div>
              </td>
              <td :class="['text-right font-bold', t.type === 'IN' ? 'text-success' : 'text-danger']">
                {{ t.type === 'IN' ? '+' : '-' }} {{ t.amount.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
              </td>
              <td class="text-right font-bold">
                {{ $t('common.egp') }} {{ t.running_balance.toLocaleString(undefined, {minimumFractionDigits: 2}) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-backdrop">
      <div class="card modal-content animate-pop">
        <div class="card-header">
          <h2 class="card-title" :class="modalType === 'IN' ? 'text-success' : 'text-danger'">
            {{ modalType === 'IN' ? $t('dashboard.add_money') : $t('dashboard.withdraw_money') }}
          </h2>
          <button class="btn btn-secondary btn-sm rounded-full" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ $t('common.amount') }} ({{ $t('common.egp') }})</label>
            <input type="number" v-model="form.amount" class="form-control font-bold text-xl" placeholder="0.00" autofocus />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('common.details') }}</label>
            <textarea v-model="form.description" class="form-control" :placeholder="$t('common.notes')" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModal = false">{{ $t('common.cancel') }}</button>
          <button :class="['btn', modalType === 'IN' ? 'btn-success' : 'btn-danger']" @click="submitManualEntry" :disabled="loading || (modalType === 'OUT' && form.amount > stats.current_balance)">
            {{ loading ? '...' : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TheTreasury",
  data() {
    return {
      transactions: [],
      stats: { current_balance: 0, total_in: 0, total_out: 0 },
      filters: { type: "ALL", fromDate: "", toDate: "", search: "" },
      showModal: false,
      modalType: 'IN',
      form: { amount: "", description: "" },
      loading: false
    };
  },
  methods: {
    async fetchTreasury() {
      try {
        const query = new URLSearchParams(this.filters).toString();
        const res = await fetch(`${process.env.VUE_APP_API_URL}/treasury?${query}`);
        const data = await res.json();
        this.transactions = data.transactions;
        this.stats.current_balance = data.current_balance;
        this.stats.total_in = data.total_in;
        this.stats.total_out = data.total_out;
      } catch (err) {
        console.error("Treasury fetch error:", err);
      }
    },
    openModal(type) {
      this.modalType = type;
      this.form.amount = "";
      this.form.description = "";
      this.showModal = true;
    },
    async submitManualEntry() {
      if (!this.form.amount || this.form.amount <= 0) return alert("Please enter a valid amount");
      
      if (this.modalType === 'OUT' && this.form.amount > this.stats.current_balance) {
        return alert("Error: Insufficient funds in treasury.");
      }

      this.loading = true;
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/treasury/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: this.modalType,
            amount: parseFloat(this.form.amount),
            description: this.form.description || (this.modalType === 'IN' ? "Manual Deposit" : "Manual Withdrawal")
          })
        });
        
        if (res.ok) {
          this.showModal = false;
          this.fetchTreasury();
        } else {
          const err = await res.json();
          alert(err.error || "Transaction failed");
        }
      } catch (err) {
        console.error(err);
      } finally { this.loading = false; }
    }
  },
  mounted() { this.fetchTreasury(); }
};
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.header-actions { display: flex; gap: 12px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.stat-card.primary { border-left: 4px solid var(--primary); }
.stat-card.success { border-left: 4px solid var(--success); }
.stat-card.danger { border-left: 4px solid var(--danger); }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.stat-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
.stat-value { font-size: 1.5rem; font-weight: 800; }

.filters-card { padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.filters-row { display: flex; gap: 20px; flex-wrap: wrap; }
.filter-group { flex: 1; min-width: 200px; }

.date-range { display: flex; align-items: center; gap: 10px; color: var(--text-light); font-weight: 600; }

.text-right { text-align: right; }
.text-success { color: var(--success); }
.text-danger { color: var(--danger); }
.text-center { text-align: center; }
.text-xs { font-size: 0.75rem; }
.font-bold { font-weight: 800; }
.font-semibold { font-weight: 600; }

.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 2000;
}

.modal-content { width: 100%; max-width: 500px; padding: 0; position: relative; }
.modal-body { padding: 24px; }
.modal-footer { padding: 16px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 12px; }

.text-xl { font-size: 1.5rem; }
.rounded-full { border-radius: 999px; width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; }

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
  .filters-row { flex-direction: column; }
}
</style>
