<template>
  <div class="owner-dashboard animate-fade-in">
    <div class="page-header">
      <h1 class="page-title">{{ $t('ownerDashboard.title') }}</h1>
      <BaseButton @click="generateInvite" variant="primary" :loading="isSubmitting">
        {{ $t('ownerDashboard.generateInvite') }}
      </BaseButton>
    </div>

    <!-- Alert for new invite code -->
    <div v-if="newInviteCode" class="card bg-success-light border-success animate-slide-up mb-6">
      <div class="flex items-center gap-4">
        <span class="text-2xl">✨</span>
        <div>
          <strong class="text-success block text-lg">{{ $t('ownerDashboard.newInviteCode') }}: {{ newInviteCode }}</strong>
          <p class="text-sm opacity-80">{{ $t('ownerDashboard.inviteExpiresIn') }}</p>
        </div>
      </div>
    </div>

    <div class="card table-card">
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('auth.email') }}</th>
              <th>{{ $t('ownerDashboard.role') }}</th>
              <th>{{ $t('ownerDashboard.status') }}</th>
              <th>{{ $t('ownerDashboard.createdAt') }}</th>
              <th>{{ $t('common.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
              <td><div class="skeleton"></div></td>
            </tr>
            <tr v-else-if="tenants.length === 0">
              <td colspan="6" class="text-center">{{ $t('ownerDashboard.noTenants') }}</td>
            </tr>
            <tr v-for="tenant in tenants" :key="tenant.id">
              <td>#{{ tenant.id }}</td>
              <td class="font-bold">{{ tenant.email }}</td>
              <td>
                <span :class="['badge', tenant.role === 'owner' ? 'badge-primary' : 'badge-secondary']">
                  {{ tenant.role }}
                </span>
              </td>
              <td>
                <span :class="['badge', tenant.status === 'active' ? 'badge-success' : 'badge-danger']">
                  {{ tenant.status }}
                </span>
              </td>
              <td class="text-sm text-muted">{{ new Date(tenant.createdAt).toLocaleDateString() }}</td>
              <td class="actions">
                <div class="flex gap-2">
                  <button 
                    v-if="tenant.status === 'active' && tenant.role !== 'owner'" 
                    @click="suspendTenant(tenant.id)" 
                    class="btn btn-secondary btn-sm"
                    :title="$t('ownerDashboard.suspend')"
                  >
                    🚫
                  </button>
                  <button 
                    v-if="tenant.status === 'suspended' && tenant.role !== 'owner'" 
                    @click="activateTenant(tenant.id)" 
                    class="btn btn-success btn-sm"
                    :title="$t('ownerDashboard.activate')"
                  >
                    ✅
                  </button>
                  <button 
                    v-if="tenant.role !== 'owner'" 
                    @click="deleteTenant(tenant.id)" 
                    class="btn btn-danger btn-sm"
                    :title="$t('ownerDashboard.delete')"
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
import { useAppSystem } from '@/composables/useAppSystem';
import BaseButton from '@/components/common/BaseButton.vue';

export default {
  name: "TheOwnerDashboard",
  components: { BaseButton },
  setup() {
    const { toast, setLoading } = useAppSystem();
    return { toast, setLoading };
  },
  data() {
    return {
      tenants: [],
      isLoading: false,
      isSubmitting: false,
      newInviteCode: null
    };
  },
  mounted() {
    this.fetchTenants();
  },
  methods: {
    async fetchTenants() {
      this.isLoading = true;
      this.setLoading(true);
      try {
        const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/admin/tenants`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          this.tenants = await res.json();
        } else {
          this.toast.error("Failed to fetch tenants");
        }
      } catch (err) {
        console.error(err);
        this.toast.error(this.$t('auth.network_error'));
      } finally {
        this.isLoading = false;
        this.setLoading(false);
      }
    },
    async suspendTenant(id) {
      if (!confirm("Are you sure you want to suspend this tenant?")) return;
      this.setLoading(true);
      try {
        const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/admin/tenants/${id}/suspend`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          this.toast.success("Tenant suspended");
          this.fetchTenants();
        }
      } catch (err) {
        console.error(err);
        this.toast.error("Operation failed");
      } finally {
        this.setLoading(false);
      }
    },
    async activateTenant(id) {
      this.setLoading(true);
      try {
        const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/admin/tenants/${id}/activate`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          this.toast.success("Tenant activated");
          this.fetchTenants();
        }
      } catch (err) {
        console.error(err);
        this.toast.error("Operation failed");
      } finally {
        this.setLoading(false);
      }
    },
    async deleteTenant(id) {
      if (!confirm("Are you sure you want to delete this tenant permanently?")) return;
      this.setLoading(true);
      try {
        const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/admin/tenants/${id}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          this.toast.success("Tenant deleted");
          this.fetchTenants();
        }
      } catch (err) {
        console.error(err);
        this.toast.error("Delete failed");
      } finally {
        this.setLoading(false);
      }
    },
    async generateInvite() {
      this.isSubmitting = true;
      try {
        const token = localStorage.getItem("jwt_token");
        const res = await fetch(`${process.env.VUE_APP_API_URL}/admin/invites`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          this.newInviteCode = data.invite.code;
          this.toast.success("New invite code generated!");
        }
      } catch (err) {
        console.error(err);
        this.toast.error("Failed to generate invite");
      } finally {
        this.isSubmitting = false;
      }
    }
  }
};
</script>

<style scoped>
.mb-6 { margin-bottom: 1.5rem; }
.bg-success-light { background: #f0fdf4; }
.border-success { border: 1px solid #bbf7d0; }
.text-success { color: #15803d; }
.flex { display: flex; }
.items-center { align-items: center; }
.gap-4 { gap: 1rem; }
.block { display: block; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.opacity-80 { opacity: 0.8; }
.text-sm { font-size: 0.875rem; }
</style>

