<template>
  <div class="sales-page">
    <div class="page-header">
      <h1 class="page-title">{{ $t('sales.title') }}</h1>
    </div>

    <div class="pos-layout">
      <!-- Products Selection Area -->
      <div class="products-section">
        <div class="card search-card">
          <div class="form-group mb-0">
            <input
              type="text"
              class="form-control"
              :placeholder="$t('common.search_placeholder')"
              v-model="search"
            />
          </div>
        </div>

        <div class="products-grid">
          <div
            v-for="product in filteredproducts"
            :key="product.id"
            :class="[
              'product-card',
              {
                'out-of-stock': isOutOfStock(product.low_stock_threshold) || expired(product),
              },
            ]"
            @click="addToCart(product)"
          >
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-price">{{ $t('common.egp') }} {{ product.selling_price.toFixed(2) }}</div>
            </div>
            <div class="product-footer">
              <span class="badge" :class="product.low_stock_threshold > 5 ? 'badge-secondary' : 'badge-warning'">
                {{ $t('inventory.stock') }}: {{ product.low_stock_threshold }} {{ product.unit }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cart and Checkout Area -->
      <div class="cart-section">
        <div class="card checkout-card">
          <div class="card-header">
            <h2 class="card-title">🛒 {{ $t('sales.cart') }}</h2>
            <button class="btn btn-secondary btn-sm" @click="clearCart()">{{ $t('sales.clear') }}</button>
          </div>

          <div class="cart-items">
            <div v-if="cart.length === 0" class="empty-cart">
              <div class="empty-icon">🛍️</div>
              <p>{{ $t('sales.empty_cart') }}</p>
            </div>
            
            <div v-for="item in cart" :key="item.id" class="cart-item">
              <div class="item-main">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-price">{{ $t('common.egp') }} {{ item.selling_price.toFixed(2) }}</div>
              </div>
              <div class="item-controls">
                <span class="item-qty">x{{ item.quantity }}</span>
                <span class="item-subtotal">{{ $t('common.egp') }} {{ (item.selling_price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="checkout-footer">
            <div class="summary-line total">
              <span>{{ $t('sales.total') }}</span>
              <span>{{ $t('common.egp') }} {{ totalPrice.toFixed(2) }}</span>
            </div>

            <!-- Customer and Payment Details -->
            <div class="checkout-details">
              <div class="form-group">
                <label class="form-label">{{ $t('common.phone') }}</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="customer.phone"
                  @input="searchCustomer"
                  :placeholder="$t('common.phone')"
                />
              </div>
              <div class="form-group">
                <label class="form-label">{{ $t('common.name') }}</label>
                <input
                  type="text"
                  class="form-control"
                  v-model="customer.name"
                  :placeholder="$t('common.name')"
                />
              </div>
              
              <div v-if="customer.debt > 0" class="debt-warning">
                ⚠️ {{ $t('dashboard.debt') }}: {{ $t('common.egp') }} {{ customer.debt.toFixed(2) }}
              </div>

              <div class="form-group">
                <label class="form-label">{{ $t('sales.paid') }}</label>
                <div class="amount-input">
                  <input
                    type="number"
                    class="form-control font-bold"
                    v-model.number="paidAmount"
                    :max="totalPrice"
                    placeholder="0.00"
                    @focus="$event.target.select()"
                  />
                </div>
              </div>

              <div class="summary-line remaining" :class="{ 'warning': remainingAmount > 0 }">
                <span>{{ $t('sales.remaining') }}</span>
                <span>{{ $t('common.egp') }} {{ remainingAmount.toFixed(2) }}</span>
              </div>
            </div>

            <BaseButton 
              class="btn-xl w-full" 
              @click="completeSale"
              :loading="isSubmitting"
            >
              🚀 {{ $t('sales.complete') }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useAppSystem } from '@/composables/useAppSystem';
import BaseButton from '@/components/common/BaseButton.vue';

export default {
  props: ["datas"],
  components: { BaseButton },
  setup() {
    const { toast, setLoading } = useAppSystem();
    return { toast, setLoading };
  },
  data() {
    return {
      search: "",
      cart: [],
      products: [],
      originalProducts: [],
      customer: {
        id: null,
        name: "",
        phone: "",
        debt: 0,
      },
      paidAmount: 0,
      isSubmitting: false,
    };
  },

  watch: {
    datas: {
      immediate: true,
      handler(newVal) {
        if (newVal && newVal.length > 0) {
          this.products = JSON.parse(JSON.stringify(newVal));
          this.originalProducts = JSON.parse(JSON.stringify(newVal));
        }
      },
    },
  },

  mounted() {
    if (!this.datas || this.datas.length === 0) {
      this.fetchProducts();
    }
  },

  methods: {
    async fetchProducts() {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/product`);
        const data = await res.json();
        this.products = data;
        this.originalProducts = [...data];
      } catch (err) {
        console.error("fetchProducts error:", err);
      }
    },

    async searchCustomer() {
      if (this.customer.phone.length >= 10) {
        try {
          const res = await fetch(
            `${process.env.VUE_APP_API_URL}/customers/search/${this.customer.phone}`
          );
          if (res.ok) {
            const data = await res.json();
            this.customer.id = data.id;
            this.customer.name = data.name;
            this.customer.debt = data.total_debt;
          } else {
            this.customer.id = null;
            this.customer.debt = 0;
          }
        } catch (err) {
          console.error(err);
        }
      }
    },

    addToCart(product) {
      if (
        !product ||
        product.low_stock_threshold <= 0 ||
        this.expired(product)
      ) {
        return;
      }
      const item = this.cart.find((i) => i.id === product.id);
      if (item) {
        item.quantity += 1;
      } else {
        this.cart.push({ ...product, quantity: 1 });
      }
      product.low_stock_threshold -= 1;

      if (this.paidAmount === this.totalPrice - product.selling_price) {
        this.paidAmount = this.totalPrice;
      }
    },

    clearCart() {
      this.products = [...this.originalProducts];
      this.cart = [];
      this.paidAmount = 0;
      this.customer = { id: null, name: "", phone: "", debt: 0 };
    },

    async completeSale() {
      if (this.cart.length === 0) {
        this.toast.warn(this.$t('sales.empty_cart'));
        return;
      }

      if (this.paidAmount > this.totalPrice) {
        this.toast.error(this.$t('suppliers.debt_warning') || "Paid amount cannot exceed total");
        return;
      }

      if (
        this.remainingAmount > 0 &&
        (!this.customer.name || !this.customer.phone)
      ) {
        this.toast.warn(this.$t('sales.customer_req') || "Customer details required for debt");
        return;
      }

      this.isSubmitting = true;
      this.setLoading(true);

      try {
        if (this.customer.phone && !this.customer.id) {
          const custRes = await fetch(`${process.env.VUE_APP_API_URL}/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: this.customer.name || "Unknown",
              phone: this.customer.phone,
            }),
          });
          const custData = await custRes.json();
          this.customer.id = custData.id;
        }

        const saleData = {
          customer_id: this.customer.id,
          customer_name: this.customer.name || "Walk-in Customer",
          total: this.totalPrice,
          paid: this.paidAmount,
          items: this.cart.map((i) => ({
            id: i.id,
            quantity: i.quantity,
            selling_price: i.selling_price,
          })),
        };

        const res = await fetch(`${process.env.VUE_APP_API_URL}/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saleData),
        });

        if (res.ok) {
          this.toast.success(this.$t('sales.success') || "Sale completed successfully!");
          this.printInvoice();
          this.clearCart();
          this.$emit("fetch-products");
        } else {
          const errData = await res.json();
          this.toast.error(errData.message || this.$t('common.error'));
        }
      } catch (err) {
        console.error(err);
        this.toast.error(this.$t('auth.network_error'));
      } finally {
        this.isSubmitting = false;
        this.setLoading(false);
      }
    },

    printInvoice() {
      const date = new Date().toLocaleString();
      const storeName = localStorage.getItem('store_name') || this.$t('common.app_name');
      const printWindow = window.open("", "", "width=500,height=700");
      const isRtl = document.documentElement.dir === 'rtl';
      const invoiceHTML = `
        <html dir="${isRtl ? 'rtl' : 'ltr'}">
          <head>
            <title>${this.$t('common.print')}</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #333; direction: ${isRtl ? 'rtl' : 'ltr'}; }
              .header { text-align: center; margin-bottom: 20px; }
              .store-name { font-size: 24px; font-weight: 800; margin-bottom: 5px; color: #1e293b; }
              .line { border-top: 1px dashed #000; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border-bottom: 1px solid #ddd; text-align: ${isRtl ? 'right' : 'left'}; }
              .total-box { margin-top: 15px; text-align: ${isRtl ? 'left' : 'right'}; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: gray; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="store-name">🌾 ${storeName}</div>
              <p>${isRtl ? 'فاتورة بيع' : 'Sales Invoice'}</p>
            </div>
            <div class="info">
              <div><strong>${this.$t('common.customer')}:</strong> ${this.customer.name || (isRtl ? "عميل نقدي" : "Walk-in")}</div>
              <div><strong>${this.$t('common.phone')}:</strong> ${this.customer.phone || "N/A"}</div>
              <div><strong>${this.$t('common.timestamp')}:</strong> ${date}</div>
            </div>
            <div class="line"></div>
            <table>
              <thead>
                <tr>
                  <th>${this.$t('common.name')}</th>
                  <th>${this.$t('sales.qty')}</th>
                  <th>${this.$t('sales.price')} ({$t('common.egp')}})</th>
                </tr>
              </thead>
              <tbody>
                ${this.cart.map(i => `
                  <tr>
                    <td>${i.name}</td>
                    <td>${i.quantity}</td>
                    <td>${i.selling_price.toFixed(2)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="total-box">
              <div>${this.$t('sales.total')}: <strong>${this.totalPrice.toFixed(2)} ${this.$t('common.egp')}</strong></div>
              <div>${this.$t('sales.paid')}: <strong>${this.paidAmount.toFixed(2)} ${this.$t('common.egp')}</strong></div>
              <div style="color: ${this.remainingAmount > 0 ? "red" : "green"}">
                ${this.$t('sales.remaining')}: <strong>${this.remainingAmount.toFixed(2)} ${this.$t('common.egp')}</strong>
              </div>
            </div>
            <div class="footer">${isRtl ? 'شكراً لزيارتكم!' : 'Thank you for your purchase!'}</div>
          </body>
        </html>
      `;
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    },

    isOutOfStock(stock) {
      return stock <= 0;
    },
    expired(product) {
      return product.expire_date && new Date(product.expire_date) < new Date();
    },
  },

  computed: {
    filteredproducts() {
      return this.products.filter(
        (p) =>
          !this.search ||
          p.name.toLowerCase().includes(this.search.toLowerCase())
      );
    },
    totalPrice() {
      return this.cart.reduce(
        (sum, i) => sum + i.selling_price * i.quantity,
        0
      );
    },
    remainingAmount() {
      return Math.max(0, this.totalPrice - this.paidAmount);
    },
  },
};
</script>

<style scoped>
.pos-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
  min-height: calc(100vh - 160px);
  align-items: start;
}

.products-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-card { padding: 12px; }

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
  padding-bottom: 12px;
}

.product-card {
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
  min-height: 90px;
}

.product-card:hover:not(.out-of-stock) {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.product-card.out-of-stock {
  opacity: 0.5;
  background: var(--bg-muted);
  cursor: not-allowed;
}

.product-name { font-weight: 700; color: var(--text-main); margin-bottom: 6px; font-size: 0.9rem; }
.product-price { font-weight: 800; color: var(--primary); font-size: 1rem; }
.product-footer { margin-top: 10px; }

.cart-section {
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 12px;
}

.checkout-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  max-height: calc(100vh - 140px);
  overflow: hidden;
}

.checkout-card .card-header { padding: 16px 20px; margin-bottom: 0; }

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
  -webkit-overflow-scrolling: touch;
}

.empty-cart {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
}
.empty-icon { font-size: 2.5rem; margin-bottom: 10px; }

.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  gap: 8px;
}
.item-name { font-weight: 600; color: var(--text-main); font-size: 0.9rem; }
.item-price { font-size: 0.8rem; color: var(--text-muted); }
.item-controls { text-align: end; flex-shrink: 0; }
.item-qty { font-weight: 700; color: var(--primary); margin-inline-end: 10px; }
.item-subtotal { font-weight: 700; font-size: 0.9rem; }

.checkout-footer {
  padding: 16px;
  background: var(--bg-muted);
  border-top: 1px solid var(--border-color);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 700;
}
.summary-line.total { font-size: 1.3rem; color: var(--text-main); }
.summary-line.remaining.warning { color: var(--danger); }

.checkout-details { margin-bottom: 16px; }
.mb-0 { margin-bottom: 0; }
.w-full { width: 100%; }
.btn-xl { padding: 14px; font-size: 1rem; border-radius: var(--radius-lg); min-height: 52px; }

.debt-warning {
  background: #fffbeb;
  color: #92400e;
  padding: 10px;
  border-radius: var(--radius-md);
  margin-bottom: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid #fef3c7;
}

/* --- TABLET (≤ 1024px): stack layout --- */
@media (max-width: 1024px) {
  .pos-layout {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: 16px;
  }

  .products-grid {
    max-height: 45vh;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }

  .cart-section {
    position: static;
  }

  .checkout-card {
    max-height: none;
  }

  .cart-items {
    max-height: 240px;
  }
}

/* --- MOBILE (≤ 768px) --- */
@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
    max-height: 40vh;
  }

  .product-card {
    padding: 10px;
    min-height: 76px;
  }

  .product-name { font-size: 0.82rem; }
  .product-price { font-size: 0.9rem; }

  .summary-line.total { font-size: 1.1rem; }

  .checkout-footer {
    padding: 12px;
  }
}

/* --- SMALL MOBILE (≤ 480px) --- */
@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .product-card {
    padding: 8px;
    border-radius: var(--radius-md);
  }

  .product-footer { display: none; } /* hide stock badges on tiny screens */
}
</style>
