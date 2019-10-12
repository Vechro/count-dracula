const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const roman = require("romanjs");
const { prefix, token, path } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

let storage;

// Example structure of the JSON
const data = {
    counting: true,
    channelId: "",
    lastNumber: 0,
    users: [
        {
            userId: "",
            banishments: 0,
            unbanDate: 0,
        },
    ],
};

if (fs.existsSync(path)) {
    storage = jsonfile.readFileSync(path, function (err) {
        if (err) {
            console.log(err);
        }
    });
} else {
    storage = data;
    jsonfile.writeFileSync(path, storage, function (err) {
        if (err) {
            console.log(err);
        }
    });
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

client.once("ready", () => {
    console.log("Ready!");
});
// Make commands admin-only, resetting the count on misuse
client.on("message", message => {

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const countAttempt = message.content.split(/ +/)[0];
    try {
        if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot) {
            if (isValidInt(countAttempt, storage.lastNumber + 1)) {
                storage.lastNumber++;
                jsonfile.writeFileSync(path, storage);
                return;
            } else {
                // TODO: Specify by mentioning the user
                message.channel.send("Someone messed up!");
                storage.lastNumber = Math.floor(storage.lastNumber * 0.9);
                message.channel.send(storage.lastNumber);
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