const jsonfile = require("jsonfile");
const { path } = require("../config.json");

module.exports = {
    name: "count",
    description: "Start count at a specified number.",
    aliases: ["startat"],
    execute(message, args) {

        const storage = jsonfile.readFileSync(path, function (err) {
            if (err) {
                console.log(err);
            }
        });

        if (!storage.channelId) {
            message.reply("There is no channel set up for counting.");
            return;
        }

        storage.counting = true;
        storage.lastNumber = args[0] || 0;

        jsonfile.writeFileSync(path, storage);
        message.send(storage.lastNumber);
    },
};