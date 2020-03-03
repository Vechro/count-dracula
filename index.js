const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const {
    setUserRestriction,
    convertToBase10,
    ban,
    createDirectories,
} = require("./functions");
const moment = require("moment");
const { prefix, token, dataPath } = require("./config.json");

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

createDirectories(dataPath);

const storage = InitializeStorage(
    fs.existsSync(dataPath) ? jsonfile.readFileSync(dataPath, function (err) {
        if (err) {
            console.log(err);
        }
    }) : jsonfile.writeFile(dataPath, data) || data,
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
        if (user.unbanDate < currentTime && user.unbanDate !== "0") {
            // Unban user
            setUserRestriction(client, storage.channelId, id, null);
            user.unbanDate = "0";

        }
    });
}

client.once("ready", () => {
    // Poll asynchronously on launch
    setTimeout(() => {
        pollUsers();
        setInterval(pollUsers, 5 * 60 * 1000);
    }, 0);
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

// This handles message edits
client.on("messageUpdate", (oldMessage, newMessage) => {
    handleMessageUpdate(oldMessage, newMessage).catch(function (err) {
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
            jsonfile.writeFile(dataPath, storage);
            return;

        } else {
            ban(client, message, storage, true);
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

    console.log("Message deletion spotted!");

    if (storage.lastMessageId !== message.id || message.channel.id !== storage.channelId) {
        return;
    }

    if (message.content.startsWith(prefix) || message.author.bot || !storage.counting) {
        return;
    }

    const snowflakeUtil = Discord.SnowflakeUtil;

    const momentBefore = snowflakeUtil.generate(exactMoment - 1000);
    const momentAfter = snowflakeUtil.generate(exactMoment + 1);

    if (!message.member.hasPermission("MANAGE_ROLES")) {

        const logs = await message.guild.fetchAuditLogs({ type: 72, before: momentAfter, after: momentBefore });

        // Check if there is exactly 1 log, probably works
        if (logs.entries.length !== 1) {
            // Handle ban, but don't rewind count
            ban(client, message, storage, false);
        }
    } else {
        console.log("Ignoring due to high permissions of deleter or channel mismatch");
    }
}

async function handleMessageUpdate(oldMessage, newMessage) {

    console.log("Message edit spotted!");

    if (storage.lastMessageId !== oldMessage.id || oldMessage.channel.id !== storage.channelId) {
        return;
    }

    console.log("1");

    if (oldMessage.content.startsWith(prefix) || oldMessage.author.bot || !storage.counting) {
        return;
    }

    console.log("2");

    const oldCount = oldMessage.content.split(/ +/)[0];
    const newCount = newMessage.content.split(/ +/)[0];

    if (convertToBase10(oldCount) !== convertToBase10(newCount)) {
        console.log("3");
        ban(client, oldMessage, storage, false);
    }


}

client.login(token);