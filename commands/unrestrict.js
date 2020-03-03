const jsonfile = require("jsonfile");
const { dataPath } = require("../config.json");
const { setUserRestriction } = require("../functions");

module.exports = {
    name: "unrestrict",
    description: "Unrestrict user from counting.",
    aliases: ["unban"],
    usage: "[user]",
    execute(message, args, storage) {
        setUserRestriction(message.client, storage.channelId, message.mentions.users.first().id, null);

        const storageUser = storage.users.get(message.mentions.users.first().id);
        if (storageUser) {
            storageUser.unbanDate = "0";
        }

        jsonfile.writeFile(dataPath, storage);
        message.channel.send("User has been unbanned!");
    },
};