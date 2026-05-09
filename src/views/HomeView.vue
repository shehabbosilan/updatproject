<template>
  <div class="app-wrapper">
    <!-- Header -->
    <HederHead 
      :isSidebarOpen="isSidebarOpen" 
      :currentPage="pages"
      @toggle-sidebar="toggleSidebar" 
    />

    <div class="main-layout">
      <!-- Mobile sidebar backdrop -->
      <div 
        v-if="isSidebarOpen && isMobile" 
        class="sidebar-backdrop" 
        @click="isSidebarOpen = false"
      ></div>

      <!-- Sidebar -->
      <SidBar
        :isOpen="isSidebarOpen"
        @changePage="selectPage($event)"
        :currentPage="pages"
      />

      <!-- Content Area -->
      <main :class="['main-content', { 'full-width': !isSidebarOpen }]">
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
import { defineAsyncComponent, markRaw } from 'vue';
import HederHead from "@/components/Header_TTT.vue";
import SidBar from "@/components/SideBar.vue";
import stMixin from "@/mixins/editProduct";

// Lazy load components for performance
const DashBord = defineAsyncComponent(() => import("@/components/DashBord.vue"));
const TheProducts = defineAsyncComponent(() => import("@/components/TheProducts.vue"));
const TheInventory = defineAsyncComponent(() => import("@/components/TheInventory.vue"));
const TheSales = defineAsyncComponent(() => import("@/components/TheSales.vue"));
const ThePurchases = defineAsyncComponent(() => import("@/components/ThePurchases.vue"));
const TheCustomers = defineAsyncComponent(() => import("@/components/TheCustomers.vue"));
const TheSuppliers = defineAsyncComponent(() => import("@/components/TheSuppliers.vue"));
const TheTreasury = defineAsyncComponent(() => import("@/components/TheTreasury.vue"));
const TheReports = defineAsyncComponent(() => import("@/components/TheReports.vue"));
const TheOwnerDashboard = defineAsyncComponent(() => import("@/components/TheOwnerDashboard.vue"));
const TheAddform = defineAsyncComponent(() => import("@/components/AddProduct.vue"));
const TheEditform = defineAsyncComponent(() => import("@/components/EditeProduct.vue"));

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
    TheOwnerDashboard,
    TheAddform,
    TheEditform,
  },

  data() {
    return {
      isSidebarOpen: window.innerWidth > 768,
      isMobile: window.innerWidth <= 768,
      pages: "dashboard",
      form: "",
    };
  },

  computed: {
    currentComponent() {
      const pageMap = {
        'dashboard': 'DashBord',
        'owner-dashboard': 'TheOwnerDashboard',
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
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    selectPage(page) {
      this.pages = page;
      if (this.isMobile) {
        this.isSidebarOpen = false;
      }
    },
    veiwShowform(add) {
      this.form = add;
    },
    handleResize() {
      this.isMobile = window.innerWidth <= 768;
      if (!this.isMobile) {
        this.isSidebarOpen = true;
      }
    }
  },

  mounted() {
    window.addEventListener('resize', this.handleResize);
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
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
