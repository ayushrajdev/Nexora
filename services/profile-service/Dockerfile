FROM node:20-alpine
WORKDIR /app
COPY services/profile-service/package*.json ./
COPY shared ./shared
RUN npm install
COPY services/profile-service .
EXPOSE 3002
CMD ["node", "src/app.js"]