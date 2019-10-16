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
    designatedRoleId: 0, // Snowflake/Int
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

function setupRole(guild, guildChannel, roleName = "Can't Count") {
    const roleQuery = guild.roles.find(role => role.name === roleName);
    if (!roleQuery) {
        const role = guild.createRole({ name: roleName, mentionable: false }, "Created to restrict access to the designated counting channel.");

        guildChannel.overwritePermission(role, { "SEND_MESSAGES": false }, "Restrict access to the designated counting channel.");
        // What is error handling?
        return "Role created successfully";
    } else {
        guildChannel.overwritePermission(roleQuery, { "SEND_MESSAGES": false }, "Restrict access to the designated counting channel.");
        return "Role by that name already exists";
    }
}

// TODO: Add DMs for indicating when they're banned or unbanned
function addRole(userId, role) {

}

function removeRole(userId, role) {

}

// This function polls the userlist on an hourly basis to find anyone who should be unbanned
function pollUsers() {
    const currentTime = moment();

    storage.users.forEach(function (value, key, map) {
        if (value.unbanDate < currentTime && value.unbanDate !== 0) {
            // Add code for removing Can't Count role
            value.unbanDate = 0;

        }
    });
}

// Add role creation for "Can't Count" and unless it already exists, and add permissions to restrict the role from sending messages in channelId

setInterval(pollUsers, 60 * 60 * 1000);

client.once("ready", () => {
    // Poll asynchronously on launch
    setTimeout(pollUsers(), 0);
    console.log("Ready!");
});
// (TODO:) resetting the count on command misuse
client.on("message", message => {

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const countAttempt = message.content.split(/ +/)[0];
    try {
        if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot) {
            if (isValidInt(countAttempt, storage.lastNumber + 1)) {
                console.log("pass " + countAttempt);
                storage.lastNumber++;
                jsonfile.writeFileSync(path, storage);
                return;
            } else {
                if (storage.users.has(message.member)) {
                    const user = storage.users.get(message.member);
                    user.banishments += 1;
                    user.unbanDate = moment().add(Math.sqrt(storage.lastNumber) * 0.1 + fibonacci.iterate(user.banishments).number, "days");
                    // Sketchy, test this
                    storage.users.set(user);

                } else {
                    storage.users.set(message.member, {
                        banishments: 1,
                        unbanDate: moment().add(Math.sqrt(storage.lastNumber) * 0.1 + 1, "days"),
                    });
                }
                message.channel.send(`${message.member} messed up.`);
                storage.lastNumber = Math.floor(storage.lastNumber * 0.666);
                message.channel.send(storage.lastNumber);

                // Consider going asynchronous
                jsonfile.writeFileSync(path, storage);
                return;
            }
        }
    } catch (err) {
        message.channel.send(`Set a channel for counting by using ${prefix}usechannel`);
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
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply("There was an error trying to execute that command!");
    }
});

client.login(token);