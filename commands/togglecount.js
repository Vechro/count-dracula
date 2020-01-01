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
            message.channel.send("Counting started!");
            storage.lastUser = 0;
            message.channel.send(storage.lastNumber);
        } else {
            message.channel.send("Counting stopped!");
        }

        jsonfile.writeFileSync(path, storage);
    },
};