# --- Stage 1: build the React app ---
FROM node:24-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:alpine

# Static build output
COPY --from=build /app/build /usr/share/nginx/html

# Allow nginx user (UID 101) to write env.js
RUN chown -R 101:101 /usr/share/nginx/html

# SPA routing + no-cache rule for env.js
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Injects the runtime API_URL into env.js before nginx starts
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
