// Local development fallback only.
// In Docker/Kubernetes, this file is OVERWRITTEN at container start by
// docker-entrypoint.sh, which injects the real API_URL from an env var.
window._env_ = {
  API_URL: "http://localhost:5000"
};
