<template>
  <div class="app-wrapper">
    <!-- Header -->
    <HederHead 
      :sidebarOpen="sidebarOpen" 
      :currentPage="pages"
      @toggle-sidebar="toggleSidebar" 
    />

    <div class="main-layout">
      <!-- Sidebar -->
      <SidBar
        :isOpen="sidebarOpen"
        @changePage="selectPage($event)"
        :currentPage="pages"
      />

      <!-- Content Area -->
      <main :class="['main-content', { 'full-width': !sidebarOpen }]">
        <div class="page-content">
          <!-- Modals (Add/Edit) -->
          <TheAddform
            v-if="form == 'add'"
            @changePagea="veiwShowform($event)"
            @addProductt="addProduct($event)"
          ></TheAddform>
          
          <TheEditform
            v-if="form == 'edit'"
            @changePagea="veiwShowform($event)"
            @updateProducts="updateProducts($event)"
            :prductEdit="updateProduct"
          ></TheEditform>

          <!-- Dynamic Page Components -->
          <Transition name="fade" mode="out-in">
            <component 
              :is="currentComponent" 
              :datas="datas"
              :totalProduct="datas.length"
              @changePagea="veiwShowform($event)"
              @deleteProduct="deleteProduct($event)"
              @editProduct="getOneProduct($event)"
              @fetch-products="getProduct"
            />
          </Transition>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import HederHead from "@/components/Header_TTT.vue";
import SidBar from "@/components/SideBar.vue";
import DashBord from "@/components/DashBord.vue";
import TheProducts from "@/components/TheProducts.vue";
import TheInventory from "@/components/TheInventory.vue";
import TheSales from "@/components/TheSales.vue";
import ThePurchases from "@/components/ThePurchases.vue";
import TheCustomers from "@/components/TheCustomers.vue";
import TheSuppliers from "@/components/TheSuppliers.vue";
import TheTreasury from "@/components/TheTreasury.vue";
import TheReports from "@/components/TheReports.vue";
import TheAddform from "@/components/AddProduct.vue";
import TheEditform from "@/components/EditeProduct.vue";
import stMixin from "@/mixins/editProduct";

export default {
  name: "HomeView",
  components: {
    HederHead,
    SidBar,
    DashBord,
    TheProducts,
    TheInventory,
    TheSales,
    ThePurchases,
    TheCustomers,
    TheSuppliers,
    TheTreasury,
    TheReports,
    TheAddform,
    TheEditform,
  },

  data() {
    return {
      sidebarOpen: true,
      pages: "dashboard",
      form: "",
    };
  },

  computed: {
    currentComponent() {
      const pageMap = {
        'dashboard': 'DashBord',
        'products': 'TheProducts',
        'inventory': 'TheInventory',
        'sales': 'TheSales',
        'purchases': 'ThePurchases',
        'customers': 'TheCustomers',
        'suppliers': 'TheSuppliers',
        'treasury': 'TheTreasury',
        'reports': 'TheReports'
      };
      return pageMap[this.pages] || 'DashBord';
    }
  },

  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    selectPage(page) {
      this.pages = page;
      if (window.innerWidth <= 768) {
        this.sidebarOpen = false;
      }
    },
    veiwShowform(add) {
      this.form = add;
    },
  },

  mounted() {
    if (window.innerWidth <= 768) {
      this.sidebarOpen = false;
    }
  },
  mixins: [stMixin],
};
</script>

<style scoped>
.main-content {
  margin-top: 0;
  transition: all 0.3s ease;
}

@media (min-width: 769px) {
  html[dir="ltr"] .main-content { margin-left: var(--sidebar-width); }
  html[dir="rtl"] .main-content { margin-right: var(--sidebar-width); }

  html[dir="ltr"] .main-content.full-width { margin-left: 0; }
  html[dir="rtl"] .main-content.full-width { margin-right: 0; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
