const jsonfile = require("jsonfile");
const { dataPath } = require("../config.json");

module.exports = {
    name: "count",
    description: "Start count at a specified number.",
    aliases: ["startat"],
    execute(message, args, storage) {
        if (!storage.channelId) {
            message.reply("there is no channel set up for counting.");
            return;
        }

        storage.counting = true;
        storage.lastNumber = parseInt(args[0], 10) || 0;
        storage.lastUserId = 0;

        jsonfile.writeFile(dataPath, storage);
        message.channel.send(storage.lastNumber);
    },
};