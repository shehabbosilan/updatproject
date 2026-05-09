<template>
  <div class="modal-overlay" @click.self="$emit('changePagea', '')">
    <div class="modal-card animate-pop">
      <div class="modal-header">
        <h2 class="modal-title">{{ $t('products.add') }}</h2>
        <button class="close-btn" @click="$emit('changePagea', '')">×</button>
      </div>

      <div class="modal-body">
        <!-- Product Name -->
        <div class="form-group">
          <label class="form-label">{{ $t('products.name') }} *</label>
          <input type="text" class="form-control" v-model="product.name" />
        </div>

        <!-- Category + Unit -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">{{ $t('products.category') }} *</label>
            <select class="form-control" v-model="product.category">
              <option value="">{{ $t('products.select_category') }}</option>
              <option value="Pesticides">Pesticides</option>
              <option value="Fertilizers">Fertilizers</option>
              <option value="Seeds">Seeds</option>
              <option value="Tools">Tools</option>
              <option value="Equipment">Equipment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('products.unit') }} *</label>
            <input type="text" class="form-control" placeholder="kg, L, pcs" v-model="product.unit" />
          </div>
        </div>

        <!-- Prices -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">{{ $t('products.cost_price') }} ({{ $t('common.egp') }}) *</label>
            <input type="number" class="form-control" v-model="product.cost_price" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('products.selling_price') }} ({{ $t('common.egp') }}) *</label>
            <input type="number" class="form-control" v-model="product.selling_price" />
          </div>
        </div>

        <!-- Stock + Expiry -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">{{ $t('inventory.threshold') }}</label>
            <input type="number" class="form-control" v-model="product.low_stock_threshold" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ $t('inventory.expiry_date') }}</label>
            <input type="date" class="form-control" v-model="product.expire_date" />
          </div>
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label">{{ $t('products.description') }}</label>
          <textarea class="form-control" rows="3" v-model="product.description"></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="$emit('changePagea', '')">{{ $t('common.cancel') }}</button>
        <button class="btn btn-primary" @click="submitProduct">{{ $t('common.save') }}</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      product: {
        name: "", category: "", unit: "",
        cost_price: "", selling_price: "",
        low_stock_threshold: 10,
        description: "", expire_date: "",
      },
    };
  },
  emits: ["addProductt", "changePagea"],
  methods: {
    submitProduct() {
      if (!this.product.name || !this.product.category) {
        alert(this.$t('suppliers.name_req') || "Please fill required fields");
        return;
      }
      this.$emit("addProductt", this.product);
      this.$emit("changePagea", "");
      this.product = { name: "", category: "", unit: "", cost_price: "", selling_price: "", low_stock_threshold: 10, description: "", expire_date: "" };
    },
  },
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 16px;
}

.modal-card {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
.animate-pop { animation: popIn 0.2s ease-out; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}
.modal-title { font-size: 1.1rem; font-weight: 700; }

.close-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  line-height: 1;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover { background: var(--bg-muted); }

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.modal-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.modal-footer .btn { min-width: 100px; }

/* Mobile: single column form rows */
@media (max-width: 480px) {
  .form-row-2 { grid-template-columns: 1fr; }
  .modal-footer { justify-content: stretch; }
  .modal-footer .btn { flex: 1; }
}
</style>
