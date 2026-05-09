import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue")
  },
  {
    path: "/register",
    name: "register",
    component: () => import("../views/RegisterView.vue")
  },
  {
    path: "/forgot-password",
    name: "forgot-password",
    component: () => import("../views/ForgotPasswordView.vue")
  },
  {
    path: "/reset-password/:token",
    name: "reset-password",
    component: () => import("../views/ResetPasswordView.vue")
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("jwt_token");
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' });
  } else if ((to.name === 'login' || to.name === 'register' || to.name === 'forgot-password' || to.name === 'reset-password') && isAuthenticated) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
