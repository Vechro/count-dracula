const jsonfile = require("jsonfile");
const { isValid } = require("../functions");

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    execute(message, args, storage) {

        const optionalNumber = parseInt(args[1], 10);

        if (!isValid(optionalNumber)) {
            message.channel.send("Number is invalid, please pick something more sensible");
            return;
        }

        const channel = message.mentions.channels.first();

        storage.counting = true;
        storage.lastNumber = optionalNumber || storage.lastNumber || 0;
        storage.channelId = channel.id;
        storage.lastUserId = 0;

        jsonfile.writeFile(process.env.DATA_PATH, storage);

        message.channel.send(`Channel ${channel.id} set for counting`);
        channel.send("Channel set for counting");
        channel.send(storage.lastNumber);
    },
};
