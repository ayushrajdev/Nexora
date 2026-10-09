FROM node:20-alpine
WORKDIR /app
COPY services/chat-service/package*.json ./
COPY shared ./shared
RUN npm install
COPY services/chat-service .
EXPOSE 3004
CMD ["node", "src/app.js"]