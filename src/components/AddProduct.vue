<template>
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ $t('products.add') }}</h2>
        <button class="modal-close" @click="$emit('changePagea', '')">×</button>
      </div>

      <div class="modal-body">
        <!--  Product Name -->
        <div class="form-group">
          <label>{{ $t('products.name') }} *</label>
          <input type="text" v-model="product.name" />
        </div>

        <!--  Category + Unit -->
        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('products.category') }} *</label>
            <select v-model="product.category">
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
              placeholder="kg, L, pcs"
              v-model="product.unit"
            />
          </div>
        </div>

        <!--  Prices -->
        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('products.cost_price') }} ({{ $t('common.egp') }}) *</label>
            <input type="number" v-model="product.cost_price" />
          </div>

          <div class="form-group">
            <label>{{ $t('products.selling_price') }} ({{ $t('common.egp') }}) *</label>
            <input type="number" v-model="product.selling_price" />
          </div>
        </div>

        <!--  Stock + Expiry -->
        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('inventory.threshold') }}</label>
            <input type="number" v-model="product.low_stock_threshold" />
          </div>

          <div class="form-group">
            <label>{{ $t('inventory.expiry_date') }}</label>
            <input type="date" v-model="product.expire_date" />
          </div>
        </div>

        <!--  Description -->
        <div class="form-group">
          <label>{{ $t('products.description') }}</label>
          <textarea rows="3" v-model="product.description"></textarea>
        </div>
      </div>

      <!--  Actions -->
      <div class="modal-footer">
        <button class="btn btn-primary" @click="submitProduct">{{ $t('common.save') }}</button>

        <button class="btn btn-secondary" @click="$emit('changePagea', '')">
          {{ $t('common.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      product: {
        name: "",
        category: "",
        unit: "",
        cost_price: "",
        selling_price: "",
        low_stock_threshold: 10,
        description: "",
        expire_date: "",
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

      // reset form
      this.product = {
        name: "",
        category: "",
        unit: "",
        cost_price: "",
        selling_price: "",
        low_stock_threshold: 10,
        description: "",
        expire_date: "",
      };
    },
  },
};
</script>
