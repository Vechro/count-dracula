const jsonfile = require("jsonfile");
const { DateTime } = require("luxon");

const { restrictUser, convertToBase10 } = require("../functions");

module.exports = {
    name: "restrict",
    description: "Restrict user from counting.",
    aliases: ["ban"],
    usage: "[user] [time (minutes or 0 for permanent)]",
    execute(message, args, storage) {

        if (args.length < 2 || isNaN(convertToBase10(args[1]))) {
            message.reply("not enough arguments!");
            return;
        }

        const userId = message.mentions.users.first().id;

        restrictUser(message.client, storage.channelId, userId, true);

        const storageUser = storage.users.get(userId);

        const mins = convertToBase10(args[1]);

        if (storageUser) {
            if (mins === 0) {
                storageUser.unbanDate = "0";
            } else {
                // TODO: allow user to specify time format (eg. hours, days)
                storageUser.unbanDate = DateTime.local().plus({ minutes: mins });
            }
        } else {
            storage.users.set(userId, {
                unbanDate: DateTime.local().plus({ minutes: mins }),
            });

        }

        jsonfile.writeFile(process.env.DATA_PATH, storage);
        message.channel.send("User has been banned!");
    },
};
