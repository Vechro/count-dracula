// const fs = require('fs');
const jsonfile = require("jsonfile");

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    execute(message, args) {
        // ideally would export this data to json
        // channel = args[0];
        const channel = message.mentions.channels.first();
        // const countStart = args[1];
        let data = {
            counting: true,
            channelId: channel.id,
        }
        jsonfile.writeFileSync("./data/data.json", data);

        channel.send("Channel set for counting");

        // TODO: Don't hardcode this
        channel.send("1");
    },
};