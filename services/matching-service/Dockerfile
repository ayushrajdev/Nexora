FROM node:20-alpine
WORKDIR /app
COPY services/matching-service/package*.json ./
COPY shared ./shared
RUN cd ./shared && npm install
RUN npm install
RUN mkdir -p node_modules/@devtinder && ln -sfn /app/shared node_modules/@devtinder/shared
COPY services/matching-service .
EXPOSE 3003
CMD ["node", "src/app.js"]