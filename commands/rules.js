const jsonfile = require("jsonfile");
const { dataPath } = require("../config.json");

module.exports = {
    name: "rules",
    description: "List or modify existing rules.",
    aliases: ["rule"],
    execute(message, args, storage) {
        console.log(args);
        if (!args.length) {
            message.channel.send(JSON.stringify(storage.rules));
            return;
        }

        jsonfile.writeFile(dataPath, storage);
    },
};