const jsonfile = require("jsonfile");
const moment = require("moment");
const { path } = require("../config.json");
const { setUserRestriction, convertToBase10 } = require("../functions");

module.exports = {
    name: "Restrict",
    description: "Restrict user from counting.",
    aliases: ["ban"],
    usage: "[user] [time (minutes or 0 for permanent)]",
    execute(message, args, storage) {

        if (args.length < 2 && !isNaN(convertToBase10(args[1]))) {
            message.user.reply("not enough arguments!");
            return;
        }

        const user = message.mentions.users.first().id;

        setUserRestriction(message.client, message.guild.id, storage.channelId, user, false);

        const storageUser = storage.users.get(user);

        const mins = convertToBase10(args[1]);

        if (mins === 0) {
            storageUser.unbanDate = 0;
        } else {
            // TODO: allow user to specify time format (eg. hours, days)
            storageUser.unbanDate = moment().add(mins, "minutes");
        }

        storageUser.unbanDate = 0;

        jsonfile.writeFileSync(path, storage);
        message.channel.send("User has been banned!");
    },
};