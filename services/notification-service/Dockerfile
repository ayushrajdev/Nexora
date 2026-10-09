FROM node:20-alpine
WORKDIR /app
COPY services/notification-service/package*.json ./
COPY shared ./shared
RUN npm install
COPY services/notification-service .
EXPOSE 3006
CMD ["node", "src/app.js"]