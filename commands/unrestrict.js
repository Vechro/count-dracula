const jsonfile = require("jsonfile");
const { path } = require("../config.json");
const { unrestrictUser } = require("../functions");

module.exports = {
    name: "unrestrict",
    description: "Unrestrict user from counting.",
    aliases: ["unban"],
    execute(message, args, storage) {
        unrestrictUser(message.client, message.guild.id, storage.channelId, message.mentions.users.first().id);

        const user = storage.users.get(message.mentions.users.first().id);
        user.unbanDate = 0;

        jsonfile.writeFileSync(path, storage);
        message.reply("unbanned!");
    },
};