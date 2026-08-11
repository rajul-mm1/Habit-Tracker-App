FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production \
    && rm -rf /usr/local/lib/node_modules/npm \
              /usr/local/bin/npm \
              /usr/local/bin/npx \
              /opt/yarn-v* \
              /usr/local/lib/node_modules/corepack \
              /usr/local/bin/corepack

COPY . .

# No EXPOSE - this is a run-once script invoked by a Kubernetes CronJob,
# not a long-running server.

CMD ["node", "src/index.js"]