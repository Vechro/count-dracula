require("dotenv").config();

const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const {
    convertToBase10,
    ban,
    createDirectories,
    pollUsers,
    initializeStorage,
} = require("./functions");

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
        allowDec: true,
        allowRoman: true,
        allowHex: true,
        allowBinary: true,
        rewindOnBlunder: true,
        banishOnBlunder: true,
    },
    users: [], // Map
};

createDirectories(process.env.DATA_PATH);

const storage = initializeStorage(
    fs.existsSync(process.env.DATA_PATH) ? jsonfile.readFileSync(process.env.DATA_PATH, function (err) {
        if (err) {
            console.log(err);
        }
    }) : jsonfile.writeFile(process.env.DATA_PATH, data) || data,
);

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once("ready", () => {
    // Poll asynchronously on launch
    setTimeout(() => {
        pollUsers(client, storage);
        // Poll every 10 minutes
        setInterval(() => { pollUsers(client, storage); }, 10 * 60 * 1000);
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
    const args = message.content.slice(process.env.PREFIX.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const countAttempt = message.content.split(/ +/)[0];

    if (message.channel.id == storage.channelId && !message.content.startsWith(process.env.PREFIX) && !message.author.bot && storage.counting) {

        storage.lastMessageId = message.id;

        // Last half of this if-clause stops people from counting twice in a row
        if (convertToBase10(countAttempt) === storage.lastNumber + 1 && storage.lastUserId !== message.member.user.id) {
            storage.lastNumber += 1;
            storage.lastUserId = message.member.user.id;
            jsonfile.writeFile(process.env.DATA_PATH, storage);
            return;

        } else {
            ban(client, message, storage, true);
        }
    }

    if (!message.content.startsWith(process.env.PREFIX) || message.author.bot || message.channel.type !== "text") {
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
            reply += `\nThe proper usage would be: \`${process.env.PREFIX}${command.name} ${command.usage}\``;
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

    if (message.content.startsWith(process.env.PREFIX) || message.author.bot || !storage.counting) {
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

    if (oldMessage.content.startsWith(process.env.PREFIX) || oldMessage.author.bot || !storage.counting) {
        return;
    }

    const oldCount = oldMessage.content.split(/ +/)[0];
    const newCount = newMessage.content.split(/ +/)[0];

    if (convertToBase10(oldCount) !== convertToBase10(newCount)) {
        ban(client, oldMessage, storage, false);
    }
}

client.login(process.env.TOKEN);
