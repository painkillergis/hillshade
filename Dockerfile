FROM node:13-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn
COPY src/ src/
EXPOSE 8080
CMD ["node", "src/index.js"]
