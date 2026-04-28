<template>
  <main class="main-content">
    <div id="page-content" class="page-content">
      <div class="customers-page">
        <div class="card-header">
          <h1 class="page-title">{{ $t('customers.debt_mgmt') }}</h1>
        </div>

        <div class="card">
          <div class="search-bar">
            <input
              type="text"
              v-model="searchQuery"
              :placeholder="$t('common.search_placeholder')"
            />
          </div>

          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ $t('customers.name') }}</th>
                  <th>{{ $t('customers.phone') }}</th>
                  <th>{{ $t('customers.total_debt') }}</th>
                  <th>{{ $t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="customer in filteredCustomers" :key="customer.id">
                  <td>{{ customer.name }}</td>
                  <td>{{ customer.phone }}</td>
                  <td
                    :style="{
                      color: customer.total_debt > 0 ? '#e74c3c' : '#2ecc71',
                      fontWeight: 'bold',
                    }"
                  >
                    {{ $t('common.egp') }} {{ customer.total_debt.toFixed(2) }}
                  </td>
                  <td class="table-actions">
                    <button
                      v-if="customer.total_debt > 0"
                      class="btn btn-success btn-sm"
                      @click="openPaymentModal(customer)"
                    >
                      💰 {{ $t('customers.pay_debt') }}
                    </button>
                    <span v-else class="text-muted">{{ $t('customers.no_debt') }}</span>
                  </td>
                </tr>
                <tr v-if="filteredCustomers.length === 0">
                  <td colspan="4" style="text-align: center; padding: 20px">
                    {{ $t('common.no_records') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h3>{{ $t('customers.pay_debt') }}: {{ selectedCustomer.name }}</h3>
        <p>
          {{ $t('sales.remaining') }}:
          <strong>{{ $t('common.egp') }} {{ selectedCustomer.total_debt.toFixed(2) }}</strong>
        </p>

        <div class="form-group" style="margin-top: 15px">
          <label>{{ $t('customers.payment_amount') }}</label>
          <input
            type="number"
            v-model.number="paymentAmount"
            :max="selectedCustomer.total_debt"
            :placeholder="$t('customers.enter_amount')"
          />
        </div>

        <div
          class="modal-actions"
          style="margin-top: 20px; display: flex; gap: 10px"
        >
          <button
            class="btn btn-primary"
            @click="submitPayment"
            :disabled="paymentAmount <= 0"
          >
            {{ $t('customers.confirm_payment') }}
          </button>
          <button class="btn btn-secondary" @click="closeModal">{{ $t('common.cancel') }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  data() {
    return {
      customers: [],
      searchQuery: "",
      showModal: false,
      selectedCustomer: null,
      paymentAmount: 0,
    };
  },

  mounted() {
    this.fetchCustomers();
  },

  methods: {
    async fetchCustomers() {
      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/customers`);
        this.customers = await res.json();
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
    },

    openPaymentModal(customer) {
      this.selectedCustomer = customer;
      this.paymentAmount = customer.total_debt;
      this.showModal = true;
    },

    closeModal() {
      this.showModal = false;
      this.selectedCustomer = null;
      this.paymentAmount = 0;
    },

    async submitPayment() {
      if (!this.selectedCustomer || this.paymentAmount <= 0) return;

      try {
        const res = await fetch(`${process.env.VUE_APP_API_URL}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: this.selectedCustomer.id,
            amount: this.paymentAmount,
          }),
        });

        if (res.ok) {
          alert(this.$t('customers.payment_success'));
          this.closeModal();
          this.fetchCustomers();
        } else {
          const data = await res.json();
          alert(this.$t('common.error') + ": " + data.message);
        }
      } catch (err) {
        console.error(err);
        alert(this.$t('customers.payment_failed'));
      }
    },
  },

  computed: {
    filteredCustomers() {
      return this.customers.filter(
        (c) =>
          c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          c.phone.includes(this.searchQuery)
      );
    },
  },
};
</script>

<style scoped>
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
.modal-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
.btn-sm {
  padding: 5px 10px;
  font-size: 0.9em;
}
</style>
