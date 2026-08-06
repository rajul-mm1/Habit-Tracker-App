FROM node:24-alpine

WORKDIR /app

# Upgrade npm itself to patch CVEs in its bundled dependencies
RUN npm install -g npm@latest

COPY package*.json ./
RUN npm install --production

COPY . .

CMD ["node", "src/index.js"]