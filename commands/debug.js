const util = require("util");

module.exports = {
    name: "debug",
    description: "Debug a user",
    usage: "[user]",
    execute(message, args, storage) {

        if (args.length < 1) {
            message.user.reply("not enough arguments!");
            return;
        }

        const userId = message.mentions.users.first().id;

        const storageUser = storage.users.get(userId);

        if (storageUser.length) {
            message.channel.send(storageUser);
        } else {
            message.channel.send("Debug failed");
        }
        
    },
};