import axios from 'axios';

// IMPORTANT: React env vars (REACT_APP_*) are baked in at BUILD time, which
// is a problem in Kubernetes since the same image needs to work across
// dev/staging/prod without a rebuild. Instead, we read a small window._env_
// object that's injected at CONTAINER START time by docker-entrypoint.sh
// (see frontend/Dockerfile + docker-entrypoint.sh). public/env.js provides
// a local-dev fallback so `npm start` still works without Docker/K8s.
const API_URL = (window._env_ && window._env_.API_URL) || 'http://localhost:5000';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
