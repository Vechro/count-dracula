const jsonfile = require("jsonfile");
const { path } = require("../config.json");
const { setUserRestriction } = require("../functions");

module.exports = {
    name: "unrestrict",
    description: "Unrestrict user from counting.",
    aliases: ["unban"],
    usage: "[user]",
    execute(message, args, storage) {
        setUserRestriction(message.client, message.guild.id, storage.channelId, message.mentions.users.first().id, null);

        const user = storage.users.get(message.mentions.users.first().id);
        user.unbanDate = 0;

        jsonfile.writeFileSync(path, storage);
        message.channel.send("User has been unbanned!");
    },
};