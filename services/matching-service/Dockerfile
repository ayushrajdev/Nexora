FROM node:20-alpine
WORKDIR /app
COPY services/matching-service/package*.json ./
COPY shared ./shared
RUN npm install
COPY services/matching-service .
EXPOSE 3003
CMD ["node", "src/app.js"]