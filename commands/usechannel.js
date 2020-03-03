const jsonfile = require("jsonfile");
const { dataPath } = require("../config.json");

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    execute(message, args, storage) {

        const channel = message.mentions.channels.first();

        storage.counting = true;
        storage.lastNumber = parseInt(args[1], 10) || storage.lastNumber || 0;
        storage.channelId = channel.id;
        storage.lastUserId = 0;

        jsonfile.writeFile(dataPath, storage);
        // console.log(storage.lastNumber);
        channel.send("Channel set for counting");
        channel.send(storage.lastNumber);
    },
};