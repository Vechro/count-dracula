FROM node:13.8.0-buster-slim
WORKDIR /count-dracula
COPY package*.json ./
RUN npm install
COPY . .

# Please make sure the following directories aren't wiped at any point
# /data/data.json is the default dataPath where the bot stores its data
# /config.json has bot token and location dataPath
VOLUME [ "/data", "/config.json" ]
CMD [ "npm", "start" ]