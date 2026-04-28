import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";
import "./api"; // Global fetch interceptor

createApp(App)
  .use(i18n)
  .use(router)
  .mount("#app");
