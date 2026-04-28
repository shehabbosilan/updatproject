// Global Fetch Interceptor for Authentication
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

  // Ensure Content-Type is set for POST/PUT if body is an object/string
  if (!config.headers["Content-Type"] && config.body && typeof config.body === "string") {
    config.headers["Content-Type"] = "application/json";
  }

  const response = await originalFetch(resource, config);
  
  // Handle Unauthorized Errors globally
  if (response.status === 401 && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    console.warn("Unauthorized API call. Redirecting to login...");
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("username");
    window.location.href = "/login";
  }
  
  return response;
};
