<template>
  <div class="inventory-page">
    <div class="page-header">
      <h1 class="page-title">{{ $t('inventory.title') }}</h1>
    </div>

    <!-- Inventory Controls -->
    <div class="card filters-card">
      <div class="filters-grid">
        <div class="form-group">
          <label class="form-label">{{ $t('common.search') }}</label>
          <input
            type="text"
            class="form-control"
            :placeholder="$t('common.search_placeholder')"
            v-model="search"
          />
        </div>

        <div class="form-group">
          <label class="form-label">{{ $t('common.status') }}</label>
          <select class="form-control" v-model="statusFilter">
            <option value="all">📦 {{ $t('common.all') }}</option>
            <option value="available">✅ {{ $t('inventory.available') }}</option>
            <option value="out">❌ {{ $t('inventory.out_of_stock') }}</option>
            <option value="expired">⚠️ {{ $t('inventory.expired') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card table-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('common.name') }}</th>
              <th>{{ $t('inventory.stock') }}</th>
              <th>{{ $t('inventory.expiry_date') }}</th>
              <th class="text-center">{{ $t('common.status') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="isLoading">
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
            </tr>
            <tr v-else-if="filteredInventory.length === 0">
              <td colspan="4" class="text-center">{{ $t('common.no_records') }}</td>
            </tr>

            <tr v-for="item in filteredInventory" :key="item.id" :class="{ 'row-expired': isExpired(item) }">
              <td class="font-bold">{{ item.name }}</td>

              <td :class="{ 'text-danger font-bold': item.low_stock_threshold <= 0 }">
                {{ item.low_stock_threshold }} {{ item.unit || "pcs" }}
                <span v-if="item.low_stock_threshold <= 5 && item.low_stock_threshold > 0" class="badge badge-warning">
                  {{ $t('inventory.low_stock') }}
                </span>
              </td>

              <td>{{ formatDate(item.expire_date) }}</td>

              <td class="text-center">
                <span v-if="isExpired(item)" class="badge badge-danger">
                  {{ $t('inventory.expired') }}
                </span>
                <span v-else-if="item.low_stock_threshold <= 0" class="badge badge-secondary">
                  {{ $t('inventory.out_of_stock') }}
                </span>
                <span v-else-if="item.low_stock_threshold <= 5" class="badge badge-warning">
                   {{ $t('inventory.low_stock') }}
                </span>
                <span v-else class="badge badge-success">
                  {{ $t('inventory.available') }}
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
import { useAppSystem } from '@/composables/useAppSystem';

export default {
  setup() {
    const { toast, setLoading } = useAppSystem();
    return { toast, setLoading };
  },
  data() {
    return {
      inventory: [],
      search: "",
      statusFilter: "all",
      isLoading: false,
    };
  },
  mounted() {
    this.fetchInventory();
  },
  methods: {
    async fetchInventory() {
      this.isLoading = true;
      this.setLoading(true);
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/product`);
        if (!res.ok) throw new Error("Failed to fetch");
        this.inventory = await res.json();
      } catch (error) {
        console.error(error);
        this.toast.error(this.$t('common.error'));
      } finally {
        this.isLoading = false;
        this.setLoading(false);
      }
    },
    isExpired(item) {
      if (!item.expire_date) return false;
      return new Date(item.expire_date) < new Date();
    },
    formatDate(date) {
      if (!date) return "-";
      return new Date(date).toLocaleDateString();
    },
  },
  computed: {
    filteredInventory() {
      const today = new Date();
      return this.inventory.filter((item) => {
        const matchSearch = !this.search || item.name.toLowerCase().includes(this.search.toLowerCase());
        const expireDate = item.expire_date ? new Date(item.expire_date) : null;
        const expired = expireDate && expireDate < today;
        const inStock = item.low_stock_threshold > 0;

        let matchStatus = true;
        if (this.statusFilter === "out") matchStatus = !inStock;
        else if (this.statusFilter === "expired") matchStatus = expired;
        else if (this.statusFilter === "available") matchStatus = inStock && !expired;

        return matchSearch && matchStatus;
      });
    },
  },
};
</script>

<style scoped>
.filters-card { padding: 24px; margin-bottom: 24px; }
.filters-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }

.row-expired { background-color: rgba(239, 68, 68, 0.05); }

.text-danger { color: var(--danger); }
.font-bold { font-weight: 700; }
.text-center { text-align: center; }

@media (max-width: 768px) {
  .filters-grid { grid-template-columns: 1fr; }
}
</style>
