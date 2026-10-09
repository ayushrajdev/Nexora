FROM node:20-alpine
WORKDIR /app
COPY services/auth-service/package*.json ./
COPY shared ./shared
RUN npm install
COPY services/auth-service .
EXPOSE 3001
CMD ["node", "src/app.js"]
