const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const roman = require("romanjs");
const moment = require("moment");
const fibonacci = require("fibonacci");
const { prefix, token, path } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

// Original structure of the JSON
const data = {
    counting: true, // Bool
    channelId: 0, // Snowflake/Int
    lastNumber: 0, // Int
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
    // I'm not entirely sure what the next block does but it's supposedly for performance
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

// TODO: Add DMs for indicating when they're banned with the ban duration
function restrictUser(userId, channel) {
    channel.overwritePermissions(userId, { "SEND_MESSAGES": false }, "Restrict access to the designated counting channel.");
    console.log(`${userId} restricted from accessing channel`);
}

function unrestrictUser(userId, channel) {
    channel.overwritePermissions(userId, { "SEND_MESSAGES": true }, "Unrestrict access to the designated counting channel.");
    console.log(`${userId} unrestricted from accessing channel`);
}

// This function polls the userlist on an hourly basis to find anyone who should be unbanned
function pollUsers() {
    const currentTime = moment();

    storage.users.forEach(function (user, key) {
        if (user.unbanDate < currentTime && user.unbanDate !== 0) {
            // Unban user
            unrestrictUser(user, storage.channelId);
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
// (TODO:) resetting the count on command misuse
client.on("message", message => {

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const countAttempt = message.content.split(/ +/)[0];
    console.log("E");
    /*
    console.log("channel.id " + message.channel.id);
    console.log("channelId " + storage.channelId);
    */
    if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot) {
        console.log("F");
        if (isValidInt(countAttempt, storage.lastNumber + 1)) {
            console.log("D");
            storage.lastNumber++;
            jsonfile.writeFileSync(path, storage);
            return;
        } else {
            if (storage.users.has(message.member.user.id)) {
                console.log("A");
                const user = storage.users.get(message.member.user.id);
                user.banishments += 1;
                user.unbanDate = moment().add(Math.sqrt(storage.lastNumber) * 0.666 + fibonacci.iterate(user.banishments).number, "hours");
                storage.users.set(user);
                // Ban user
                restrictUser(user, storage.channelId);

            } else {
                console.log("B");
                storage.users.set(message.member.user.id, {
                    banishments: 1,
                    unbanDate: moment().add(Math.sqrt(storage.lastNumber) * 0.666 + 1, "hours"),
                });
            }
            message.reply("messed up.");
            storage.lastNumber = Math.floor(storage.lastNumber * 0.666);
            message.channel.send(storage.lastNumber);
            console.log("C");
            jsonfile.writeFileSync(path, storage);
            return;
        }
    }

    if (!message.content.startsWith(prefix) || message.author.bot || !message.member.hasPermission("KICK_MEMBERS")) return;

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type !== "text") {
        return message.reply("I can't execute that command inside DMs!");
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