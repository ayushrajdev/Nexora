FROM node:20-alpine
WORKDIR /app
COPY services/payment-service/package*.json ./
COPY shared ./shared
RUN npm install
COPY services/payment-service .
EXPOSE 3005
CMD ["node", "src/app.js"]