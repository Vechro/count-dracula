const jsonfile = require("jsonfile");
const { path } = require("../config.json");

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    execute(message, args) {

        const storage = jsonfile.readFileSync(path, function (err) {
            if (err) {
                console.log(err);
            }
        });

        const channel = message.mentions.channels.first();

        storage.counting = true;
        storage.lastNumber = storage.lastNumber || args[1] || 0;
        storage.channelId = channel.id;

        jsonfile.writeFileSync(path, storage);
        console.log(storage.lastNumber);
        channel.send("Channel set for counting");
        channel.send(storage.lastNumber);
    },
};