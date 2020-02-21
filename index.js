const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const {
    getRandom,
    setUserRestriction,
    fibonacci,
    convertToBase10,
} = require("./functions");
const moment = require("moment");
const { prefix, token, path } = require("./config.json");

const util = require("util");

const client = new Discord.Client();
client.commands = new Discord.Collection();

// Original structure of the JSON
const data = {
    counting: true, // Bool
    channelId: "", // Snowflake
    lastNumber: 0, // Int
    lastUserId: "", // Snowflake
    lastMessageId: "", // Snowflake
    rules: {
        allowConsecutiveCounting: false,
    },
    users: [], // Map
};
// TODO: use fs.mkdirSync(path);
const storage = InitializeStorage(
    fs.existsSync(path) ? jsonfile.readFileSync(path, function (err) {
        if (err) {
            console.log(err);
        }
    }) : jsonfile.writeFileSync(path, data) || data,
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
            setUserRestriction(client, user.guildId, storage.channelId, id, null);
            user.unbanDate = 0;

        }
    });
}

// Move to functions.js
function ban(client, message, storage, resetCount) {
    // Ignores moderators from being punished by bot as it has no effect anyway
    if (!message.member.hasPermission("MANAGE_ROLES")) {
        if (storage.users.has(message.member.user.id)) {

            const user = storage.users.get(message.member.user.id);
            user.banishments += 1;
            user.unbanDate = moment().add(Math.sqrt(storage.lastNumber) * 0.33 + Math.pow(fibonacci(user.banishments + 1), 3.3), "hours");
            setUserRestriction(client, message.guild.id, storage.channelId, message.member.user.id, false);

        } else {
            storage.users.set(message.member.user.id, {
                banishments: 1,
                unbanDate: moment().add(Math.sqrt(storage.lastNumber) * 0.67, "hours"),
            });

            setUserRestriction(client, message.guild.id, storage.channelId, message.member.user.id, false);
        }
        const unbanDate = storage.users.get(message.member.user.id).unbanDate;
        message.member.send(`You will be unbanned from counting ${moment().to(unbanDate)}`);
    }

    if (resetCount) {
        jsonfile.writeFileSync(path, storage);
        return;
    }

    storage.lastUserId = 0;

    const randomFloat = getRandom(0.6, 0.8);
    const randomInt = getRandom(23, 49);

    let proposedNumber = storage.lastNumber * randomFloat;
    if (storage.lastNumber - proposedNumber > randomInt && proposedNumber - randomInt > 0) {
        proposedNumber = storage.lastNumber - randomInt;
    }

    message.channel.send(message.member + " messed up!");
    storage.lastNumber = Math.floor(proposedNumber);
    message.channel.send(storage.lastNumber);
    jsonfile.writeFileSync(path, storage);
}

setInterval(pollUsers, 60 * 60 * 1000);

client.once("ready", () => {
    // Poll asynchronously on launch
    setTimeout(pollUsers, 0);
    console.log("Ready!");
});
// TODO: resetting the count on command misuse
client.on("message", message => {
    handleMessage(message).catch(function (err) {
        console.warn(err);
    });
});

client.on("messageDelete", message => {
    handleMessageDelete(message).catch(function (err) {
        console.warn(err);
    });
});

async function handleMessage(message) {
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const countAttempt = message.content.split(/ +/)[0];

    if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot && storage.counting) {

        storage.lastMessageId = message.id;

        // Last half of this if-clause stops people from counting twice in a row
        if (convertToBase10(countAttempt) === storage.lastNumber + 1 && storage.lastUserId !== message.member.user.id) {
            storage.lastNumber += 1;
            storage.lastUserId = message.member.user.id;
            jsonfile.writeFileSync(path, storage);
            return;

        } else {
            ban(client, message, storage);
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
        message.reply("there was an error trying to execute that command!");
    }
}

async function handleMessageDelete(message) {

    // Exact moment the event is received
    // This is as good as it gets
    const exactMoment = Date.now();

    if (storage.lastMessageId !== message.id) {
        return;
    }

    const snowflakeUtil = new Discord.SnowflakeUtil();

    const momentBefore = snowflakeUtil.construct(exactMoment - 1000);
    const momentAfter = snowflakeUtil.construct(exactMoment + 1);

    console.log(util.inspect(message));

    if (message.channel.id == storage.channelId) {

        const logs = await message.guild.fetchAuditLogs({ type: 72, before: momentAfter, after: momentBefore });

        // Check if there is exactly 1 log, probably works
        if (logs.entries.length !== 1) {
            // Handle ban
            ban(client, message, storage, false);
        }
    }
}

client.login(token);