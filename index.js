const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const roman = require("romanjs");
const moment = require("moment");
const fibonacci = require("fibonacci");
const { prefix, token, path } = require("./config.json");
const { restrictUser, unrestrictUser } = require("./functions");

const client = new Discord.Client();
client.commands = new Discord.Collection();

// Original structure of the JSON
const data = {
    counting: true, // Bool
    channelId: 0, // Snowflake/String
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

function isValidInt(string, expectedInt) {
    if (parseInt(string, 10) === expectedInt) {
        return true;
    }
    else if (string === "0" || string === "1") {
        return false;
    }
    else {
        return parseInt(string, 2) === expectedInt || parseInt(string, 16) === expectedInt || roman.parseRoman(string) === expectedInt;
    }
}

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

// This function polls the userlist on an hourly basis to find anyone who should be unbanned
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
    if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot) {
        if (isValidInt(countAttempt, storage.lastNumber + 1) && storage.lastUser !== message.member.user.id) {
            storage.lastNumber++;
            storage.lastUser = message.member.user.id;
            jsonfile.writeFileSync(path, storage);
            return;
        } else {
            if (!message.member.hasPermission("MANAGE_ROLES")) {
                if (storage.users.has(message.member.user.id)) {
                    const user = storage.users.get(message.member.user.id);
                    user.banishments += 1;
                    user.unbanDate = moment().add(Math.sqrt(storage.lastNumber) * 0.666 + Math.pow(fibonacci.iterate(user.banishments).number, 1.6), "hours");
                    // storage.users.set(message.member.user.id, user);
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
            message.reply("messed up.");
            storage.lastNumber = Math.floor(storage.lastNumber * 0.666);
            message.channel.send(storage.lastNumber);
            jsonfile.writeFileSync(path, storage);
            return;
        }
    }
    // TODO: Fix this hacky mess
    if (!message.content.startsWith(prefix) || message.author.bot) {
        return;
    }

    if (!message.channel.type === "dm" || !message.member.hasPermission("MANAGE_ROLES")) {
        return;
    }

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type !== "text") {
        return message.reply("I can't execute that command inside of DMs!");
    }

    if (command.dmOnly && message.channel.type !== "dm") {
        return message.reply("I can't execute that command outside of DMs!");
    }

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