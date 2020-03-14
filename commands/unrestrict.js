const jsonfile = require("jsonfile");

const { restrictUser } = require("../functions");

module.exports = {
    name: "unrestrict",
    description: "Unrestrict user from counting.",
    aliases: ["unban"],
    usage: "[user]",
    execute(message, args, storage) {
        restrictUser(message.client, storage.channelId, message.mentions.users.first().id, false);

        const storageUser = storage.users.get(message.mentions.users.first().id);
        if (storageUser) {
            storageUser.unbanDate = "0";
        }

        jsonfile.writeFile(process.env.DATA_PATH, storage);
        message.channel.send("User has been unbanned!");
    },
};
