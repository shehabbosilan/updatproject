<template>
  <div class="products-page">
    <div class="page-header">
      <h1 class="page-title">{{ $t('products.title') }}</h1>
      <button class="btn btn-primary" @click="veiwShowform('add')">
        ➕ {{ $t('common.add') }}
      </button>
    </div>

    <div class="card products-card">
      <!-- Search and Filter Bar -->
      <div class="card-controls">
        <div class="search-box">
          <input
            type="text"
            class="form-control"
            :placeholder="$t('common.search_placeholder')"
            v-model="search"
          />
        </div>
        <div class="filter-box">
          <select class="form-control" v-model="searchgat">
            <option value="">{{ $t('common.all') }}</option>
            <option value="Pesticides">Pesticides</option>
            <option value="Fertilizers">Fertilizers</option>
            <option value="Seeds">Seeds</option>
            <option value="Tools">Tools</option>
            <option value="Equipment">Equipment</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ $t('products.name') }}</th>
              <th>{{ $t('products.category') }}</th>
              <th class="text-center">{{ $t('products.unit') }}</th>
              <th class="text-center">{{ $t('inventory.stock') }}</th>
              <th class="text-right">{{ $t('products.selling_price') }}</th>
              <th class="text-center">{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredproducts.length === 0">
              <td colspan="6" class="text-center">{{ $t('common.no_records') }}</td>
            </tr>
            <tr v-for="product in filteredproducts" :key="product.id">
              <td class="font-bold">{{ product.name }}</td>
              <td>
                <span class="badge badge-secondary">{{ product.category }}</span>
              </td>
              <td class="text-center">{{ product.unit }}</td>
              <td class="text-center font-bold" :class="product.low_stock_threshold <= 5 ? 'text-danger' : ''">
                {{ product.low_stock_threshold }}
              </td>
              <td class="text-right font-bold text-primary">
                {{ $t('common.egp') }} {{ product.selling_price.toFixed(2) }}
              </td>
              <td class="text-center">
                <div class="action-buttons">
                  <button
                    class="btn btn-secondary btn-sm"
                    @click="veiwShowform('edit'), $emit('editProduct', product.id)"
                    :title="$t('common.edit')"
                  >
                    ✏️
                  </button>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="$emit('deleteProduct', product.id)"
                    :title="$t('common.delete')"
                  >
                    🗑️
                  </button>
                </div>
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
  props: {
    datas: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["deleteProduct", "editProduct", "changePagea", "refreshProducts"],
  data() {
    return {
      search: "",
      searchgat: "",
    };
  },
  methods: {
    async fetchProducts() {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/product`);
        const data = await res.json();
        this.$emit("refreshProducts", data);
      } catch (error) {
        console.error("fetchProducts error:", error);
      }
    },
    veiwShowform(page) {
      this.$emit("changePagea", page);
    },
  },
  mounted() {
    if (!this.datas || this.datas.length === 0) {
      this.fetchProducts();
    }
  },
  computed: {
    filteredproducts() {
      return (this.datas || []).filter((product) => {
        const matchName = !this.search || product.name.toLowerCase().includes(this.search.toLowerCase());
        const matchCategory = !this.searchgat || product.category.toLowerCase().includes(this.searchgat.toLowerCase());
        return matchName && matchCategory;
      });
    },
  },
};
</script>

<style scoped>
.products-card { padding: 0; }
.card-controls {
  padding: 20px;
  display: flex;
  gap: 16px;
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border-color);
}
.search-box { flex: 1; }
.filter-box { width: 220px; }

.action-buttons { display: flex; gap: 8px; justify-content: center; }
.text-danger { color: var(--danger); }
.text-primary { color: var(--primary); }
.font-bold { font-weight: 700; }
.text-right { text-align: right; }
.text-center { text-align: center; }

@media (max-width: 768px) {
  .card-controls { flex-direction: column; }
  .filter-box { width: 100%; }
}
</style>
