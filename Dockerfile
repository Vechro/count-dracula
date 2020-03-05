FROM node:13.8.0-buster-slim
RUN apt-get update && apt-get install -y git
WORKDIR /opt/count-dracula
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "sh", "docker-entry.sh" ]
