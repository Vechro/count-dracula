const jsonfile = require("jsonfile");

module.exports = {
    name: "usechannel",
    description: "Specify a channel to be used for counting.",
    aliases: ["setchannel"],
    execute(message, args) {

        const channel = message.mentions.channels.first();
        let countStart = args[1] || 0;
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