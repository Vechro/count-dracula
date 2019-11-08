const jsonfile = require("jsonfile");
const { path } = require("../config.json");

module.exports = {
    name: "togglecount",
    description: "Start or stop counting.",
    execute(message, args, storage) {
        if (!storage.channelId) {
            message.reply("There is no channel set up for counting.");
            return;
        }

        storage.counting = !storage.counting;
        // TODO: convert this to an actual channel
        if (storage.counting) {
            storage.channelId.send("Counting started!");
            storage.channelId.send(storage.lastNumber);
        } else {
            storage.channelId.send("Counting stopped!");
        }

        jsonfile.writeFileSync(path, storage);
        message.channel.send(storage.lastNumber);
    },
};