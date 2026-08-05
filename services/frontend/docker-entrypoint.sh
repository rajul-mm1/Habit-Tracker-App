#!/bin/sh
set -e

# Regenerate env.js at container start using whatever API_URL was passed in
# via the Deployment's env vars. This is what lets one Docker image work in
# dev, staging, and prod without a rebuild.
cat <<EOF > /usr/share/nginx/html/env.js
window._env_ = {
  API_URL: "${API_URL:-http://localhost:5000}"
};
EOF

exec nginx -g 'daemon off;'
