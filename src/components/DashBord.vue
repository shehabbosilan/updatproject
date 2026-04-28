<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h1 class="page-title">{{ $t('dashboard.title') }}</h1>
    </div>

    <!-- STATS GRID -->
    <div class="stats-grid">
      <div class="stat-card revenue">
        <div class="stat-icon">💰</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.revenue') }}</div>
          <div class="stat-value">{{ $t('common.egp') }} {{ stats.totalRevenue.toFixed(2) }}</div>
        </div>
      </div>

      <div class="stat-card debt">
        <div class="stat-icon">💸</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.debt') }}</div>
          <div class="stat-value">{{ $t('common.egp') }} {{ stats.totalDebt.toFixed(2) }}</div>
        </div>
      </div>

      <div class="stat-card customers">
        <div class="stat-icon">👥</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.customers_debt') }}</div>
          <div class="stat-value">{{ stats.customersInDebt }}</div>
        </div>
      </div>

      <div class="stat-card sales-today">
        <div class="stat-icon">📈</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.sales_today') }}</div>
          <div class="stat-value">{{ $t('common.egp') }} {{ stats.salesToday.toFixed(2) }}</div>
        </div>
      </div>

      <div class="stat-card low-stock" :class="{ 'warning': stats.lowStock > 0 }">
        <div class="stat-icon">⚠️</div>
        <div class="stat-details">
          <div class="stat-label">{{ $t('dashboard.low_stock') }}</div>
          <div class="stat-value">{{ stats.lowStock }}</div>
        </div>
      </div>
    </div>

    <!-- Recent Sales Table -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">{{ $t('dashboard.recent_trans') }}</h2>
        <button class="btn btn-secondary btn-sm" @click="loadDashboard">🔄 {{ $t('common.all') }}</button>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.timestamp') }}</th>
              <th>ID</th>
              <th>{{ $t('common.customer') }}</th>
              <th>{{ $t('common.total') }}</th>
              <th>{{ $t('common.paid') }}</th>
              <th>{{ $t('common.remaining') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="stats.recentSales.length === 0">
              <td colspan="6" class="text-center">{{ $t('common.no_records') }}</td>
            </tr>

            <tr v-for="sale in stats.recentSales" :key="sale.id">
              <td><span class="text-muted">{{ formatDate(sale.date) }}</span></td>
              <td><span class="badge badge-secondary">#{{ sale.id }}</span></td>
              <td class="font-bold">{{ sale.customer_name }}</td>
              <td class="font-bold">{{ $t('common.egp') }} {{ sale.total.toFixed(2) }}</td>
              <td><span class="text-success font-bold">{{ $t('common.egp') }} {{ sale.paid.toFixed(2) }}</span></td>
              <td>
                <span :class="sale.remaining > 0 ? 'text-danger font-bold' : 'text-muted'">
                  {{ $t('common.egp') }} {{ sale.remaining.toFixed(2) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      stats: {
        totalRevenue: 0,
        totalDebt: 0,
        customersInDebt: 0,
        lowStock: 0,
        salesToday: 0,
        recentSales: [],
      },
    };
  },

  mounted() {
    this.loadDashboard();
  },

  methods: {
    async loadDashboard() {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/dashboard`);
        if (res.ok) {
          this.stats = await res.json();
        }
      } catch (err) {
        console.error("Error loading dashboard:", err);
      }
    },

    formatDate(date) {
      if (!date) return "N/A";
      return new Date(date).toLocaleString(this.$i18n.locale === 'ar' ? 'ar-EG' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    },
  },
};
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}

.stat-card:hover { border-color: var(--primary); transform: translateY(-2px); }

.stat-icon {
  width: 56px;
  height: 56px;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-main);
}

.stat-card.warning { border-left: 4px solid var(--warning); }
.stat-card.warning .stat-value { color: var(--warning); }

.text-center { text-align: center; }
.font-bold { font-weight: 700; }
</style>
