const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const moment = require("moment");
const fibonacci = require("fibonacci");
const { prefix, token, path } = require("./config.json");
const { getRandom, restrictUser, unrestrictUser, getPrecedingMessageNumber, isValidInt } = require("./functions");

const client = new Discord.Client();
client.commands = new Discord.Collection();

// Original structure of the JSON
const data = {
    counting: true, // Bool
    channelId: 0, // Snowflake/String
    // lastMessageId: 0, // Snowflake/String
    lastNumber: 0, // Int
    lastUser: 0, // Snowflake/String
    users: [], // Map
};
// TODO: use fs.mkdirSync(path);
const storage = InitializeStorage(
    fs.existsSync(path) ? jsonfile.readFileSync(path, function (err) {
        if (err) {
            console.log(err);
        }
    }) : jsonfile.writeFileSync(path, data) || data
);


function InitializeStorage(storage) {
    storage.users = new Map(storage.users);

    storage.users.toJSON = function () {
        return [...storage.users.entries()];
    };

    return storage;
}

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// This function will be called on an hourly basis to find anyone who should be unbanned
function pollUsers() {
    const currentTime = moment();

    storage.users.forEach(function (user, id) {
        if (user.unbanDate < currentTime && user.unbanDate !== 0) {
            // Unban user
            unrestrictUser(client, user.guildId, storage.channelId, id);
            user.unbanDate = 0;

        }
    });
}

setInterval(pollUsers, 60 * 60 * 1000);

client.once("ready", () => {
    // Poll asynchronously on launch
    setTimeout(pollUsers, 0);
    console.log("Ready!");
});
// TODO: resetting the count on command misuse
client.on("message", message => {

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const countAttempt = message.content.split(/ +/)[0];
    const precedingNumber = getPrecedingMessageNumber(client, message.guild.id, storage.channelId, message.id);

    if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot) {
        // if (isValidInt(countAttempt, storage.lastNumber + 1) && storage.lastUser !== message.member.user.id) {

        if (precedingNumber !== storage.lastNumber) {
            storage.lastNumber = precedingNumber;
        }

        if (isValidInt(countAttempt, storage.lastNumber + 1)) {
            storage.lastNumber++;
            storage.lastUser = message.member.user.id;
            // storage.lastMessageId = message.id;
            jsonfile.writeFileSync(path, storage);
            return;

        } else {
            if (!message.member.hasPermission("MANAGE_ROLES")) {
                if (storage.users.has(message.member.user.id)) {

                    const user = storage.users.get(message.member.user.id);
                    user.banishments += 1;
                    user.unbanDate = moment().add(Math.sqrt(storage.lastNumber) * 0.666 + Math.pow(fibonacci.iterate(user.banishments).number, 1.6), "hours");
                    restrictUser(client, message.guild.id, storage.channelId, message.member.user.id);

                } else {
                    storage.users.set(message.member.user.id, {
                        banishments: 1,
                        guildId: message.guild.id,
                        unbanDate: moment().add(Math.sqrt(storage.lastNumber) * 0.666, "hours"),
                    });

                    restrictUser(client, message.guild.id, storage.channelId, message.member.user.id);
                }
                const unbanDate = storage.users.get(message.member.user.id).unbanDate;
                message.member.send(`You will be unbanned from counting ${moment().to(unbanDate)}`);
            }

            storage.lastUser = 0;

            const randomFloat = getRandom(0.6, 0.8);
            const randomInt = getRandom(33, 49);

            let proposedNumber = storage.lastNumber * randomFloat;
            if (storage.lastNumber - proposedNumber > randomInt && proposedNumber - randomInt > 0) {
                proposedNumber = storage.lastNumber - randomInt;
            }

            message.channel.send(message.member + " messed up!");
            storage.lastNumber = Math.floor(proposedNumber);
            message.channel.send(storage.lastNumber);
            jsonfile.writeFileSync(path, storage);
            return;
        }
    }

    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type !== "text") {
        return;
    }

    if (!message.member.hasPermission("MANAGE_ROLES")) {
        return;
    }

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }

    try {
        command.execute(message, args, storage);
    } catch (error) {
        console.error(error);
        message.reply("There was an error trying to execute that command!");
    }
});

client.login(token);