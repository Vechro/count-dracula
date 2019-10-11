const fs = require("fs");
const jsonfile = require("jsonfile");
const { path } = require("../config.json");

let storage;

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    execute(message, args) {

        if (fs.existsSync(path)) {
            storage = jsonfile.readFileSync(path, function(err) {
                if (err) {
                    console.log(err);
                }
            });
        } else {
            storage = data;
            jsonfile.writeFileSync(path, storage, function(err) {
                if(err) {
                    console.log(err);
                }
            });
        }

        const channel = message.mentions.channels.first();
        const countStart = args[1] || 0;
        const data = {
            counting: true,
            channelId: channel.id,
            lastNumber: countStart,
        };

        jsonfile.writeFileSync("./data/data.json", data);
        console.log(countStart);
        channel.send("Channel set for counting");

        channel.send(countStart);
    },
};