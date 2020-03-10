const jsonfile = require("jsonfile");
const { isValid } = require("../functions");


module.exports = {
    name: "count",
    description: "Start count at a specified number.",
    aliases: ["startat"],
    execute(message, args, storage) {
        if (!storage.channelId) {
            message.channel.send("There is no channel set up for counting.");
            return;
        }

        const optionalNumber = parseInt(args[0], 10);

        if (!isValid(optionalNumber)) {
            message.channel.send("Number is invalid, please pick something more sensible");
            return;
        }

        storage.counting = true;
        storage.lastNumber = optionalNumber || 0;
        storage.lastUserId = 0;

        jsonfile.writeFile(process.env.DATA_PATH, storage);
        message.channel.send(storage.lastNumber);
    },
};
