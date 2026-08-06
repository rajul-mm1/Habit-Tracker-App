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

EXPOSE 5000

CMD ["node", "src/server.js"]