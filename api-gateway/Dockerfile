FROM node:20-alpine
WORKDIR /app
COPY api-gateway/package*.json ./
COPY shared ./shared
RUN cd ./shared && npm install
RUN npm install
RUN mkdir -p node_modules/@devtinder && ln -sfn /app/shared node_modules/@devtinder/shared
COPY api-gateway .
EXPOSE 3000
CMD ["node", "src/app.js"]
