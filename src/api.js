// Global Fetch Interceptor for Authentication + UTF-8 + Error Handling
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;

  config = config || {};
  config.headers = config.headers || {};

  // Attach JWT Token
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  // Ensure Content-Type is set for POST/PUT/PATCH with a body
  if (!config.headers["Content-Type"] && config.body && typeof config.body === "string") {
    config.headers["Content-Type"] = "application/json; charset=utf-8";
  }

  // Tell the server the client accepts UTF-8 JSON
  config.headers["Accept"] = "application/json; charset=utf-8";
  config.headers["Accept-Charset"] = "utf-8";

  const response = await originalFetch(resource, config);

  // Handle Unauthorized (401) globally — clear session and redirect
  if (response.status === 401) {
    const isAuthPage =
      window.location.hash.includes("/login") ||
      window.location.hash.includes("/register") ||
      window.location.hash.includes("/forgot-password") ||
      window.location.hash.includes("/reset-password");

    if (!isAuthPage) {
      console.warn("Unauthorized API call. Clearing session and redirecting to login...");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      window.location.href = "/#/login";
    }
  }

  // Handle Forbidden (403) globally — subscription / suspended
  if (response.status === 403) {
    const cloned = response.clone();
    try {
      const data = await cloned.json();
      if (data.message === "Account suspended") {
        console.warn("Account suspended.");
      } else if (data.message === "Subscription expired") {
        console.warn("Subscription expired.");
      }
    } catch (_) {}
  }

  return response;
};
