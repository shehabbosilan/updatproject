<template>
  <div id="page-content" class="page-content">
    <div id="modal-overlay" class="modal-overlay">
      <div class="modal">
        <div class="modal-header">
          <h2 id="modal-title">{{ $t('products.edit') }}</h2>
          <button class="modal-close" @click="$emit('changePagea', '')">
            ×
          </button>
        </div>
        <div class="modal-body" id="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('products.name') }} *</label>
              <input type="text" id="product-name" v-model="product.name" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('products.category') }} *</label>
              <select id="product-category" v-model="product.category">
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
              <label>{{ $t('products.unit') }} *</label>
              <input
                type="text"
                id="product-unit"
                v-model="product.unit"
                placeholder="kg, L, pcs, etc."
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('products.cost_price') }} ({{ $t('common.egp') }}) *</label>
              <input
                type="number"
                id="product-cost"
                step="0.01"
                v-model="product.cost_price"
              />
            </div>
            <div class="form-group">
              <label>{{ $t('products.selling_price') }} ({{ $t('common.egp') }}) *</label>
              <input
                type="number"
                id="product-selling"
                step="0.01"
                v-model="product.selling_price"
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ $t('inventory.threshold') }}</label>
              <input
                type="number"
                id="product-low-stock"
                v-model="product.low_stock_threshold"
                min="0"
              />
            </div>
          </div>
          <div class="form-group">
            <label>{{ $t('products.description') }}</label>
            <textarea
              id="product-description"
              rows="3"
              v-model="product.description"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer" id="modal-footer">
          <button
            class="btn btn-primary"
            @click="$emit('changePagea', ''), $emit('updateProducts', product)"
          >
            {{ $t('common.save') }}
          </button>
          <button class="btn btn-secondary" @click="$emit('changePagea', '')">
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      product: {},
    };
  },
  emits: ["changePagea", "updateProducts"],
  props: {
    prductEdit: {
      type: Object,
    },
  },
  watch: {
    prductEdit: {
      immediate: true,
      handler(newval) {
        this.product = { ...newval };
      },
    },
  },
};
</script>
