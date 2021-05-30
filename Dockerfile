FROM node:14.17.0-buster-slim
WORKDIR /opt/count-dracula
COPY package*.json ./
RUN npm i
COPY . .
CMD [ "npm", "start" ]