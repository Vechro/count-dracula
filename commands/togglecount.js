const jsonfile = require("jsonfile");
const { path } = require("../config.json");

module.exports = {
    name: "togglecount",
    description: "Start or stop counting.",
    guildOnly: true,
    execute(message, args, storage) {
        if (!storage.channelId) {
            message.reply("There is no channel set up for counting.");
            return;
        }

        storage.counting = !storage.counting;

        if (storage.counting) {
            storage.channelId.send("Counting started!");
            storage.channelId.send(storage.lastNumber);
        } else {
            storage.channelId.send("Counting stopped!");
        }

        jsonfile.writeFileSync(path, storage);
        message.send(storage.lastNumber);
    },
};