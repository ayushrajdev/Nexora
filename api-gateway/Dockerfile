FROM node:20-alpine
WORKDIR /app
COPY api-gateway/package*.json ./
COPY shared ./shared
RUN npm install
COPY api-gateway .
EXPOSE 3000
CMD ["node", "src/app.js"]
