const jsonfile = require("jsonfile");
const { path } = require("../config.json");

// TODO: Verify a channel is set before allowing the command to be used
module.exports = {
    name: "togglecount",
    description: "Start or stop counting.",
    execute(message) {

        const storage = jsonfile.readFileSync(path, function (err) {
            if (err) {
                console.log(err);
            }
        });

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