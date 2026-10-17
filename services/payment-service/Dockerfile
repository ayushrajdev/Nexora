FROM node:20-alpine
WORKDIR /app
COPY services/payment-service/package*.json ./
COPY shared ./shared
RUN cd ./shared && npm install
RUN npm install
RUN mkdir -p node_modules/@devtinder && ln -sfn /app/shared node_modules/@devtinder/shared
COPY services/payment-service .
EXPOSE 3005
CMD ["node", "src/app.js"]