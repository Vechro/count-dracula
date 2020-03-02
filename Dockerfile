FROM node:13.8.0-buster-slim
WORKDIR /count-dracula
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "npm", "start" ]