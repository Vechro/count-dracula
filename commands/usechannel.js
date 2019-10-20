const jsonfile = require("jsonfile");
const { path } = require("../config.json");

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    guildOnly: true,
    execute(message, args, storage) {

        const channel = message.mentions.channels.first();

        storage.counting = true;
        storage.lastNumber = parseInt(args[1], 10) || storage.lastNumber || 0;
        storage.channelId = channel.id;
        storage.lastUser = 0;

        jsonfile.writeFileSync(path, storage);
        console.log(storage.lastNumber);
        channel.send("Channel set for counting");
        channel.send(storage.lastNumber);
    },
};