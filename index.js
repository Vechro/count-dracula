const fs = require("fs");
const jsonfile = require("jsonfile");
const Discord = require("discord.js");
const { prefix, token } = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

// const storage = JSON.parse(fs.readFileSync('./data/data.json', 'utf8'));
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

if (fs.existsSync("./data/data.json")) {
    storage = jsonfile.readFileSync("./data/data.json", function(err) {
        if (err) {
            console.log(err);
        }
    });
} else {
    storage = data;
    jsonfile.writeFileSync("./data/data.json", storage, function(err) {
        if(err) {
            console.log(err);
        }
    });
}

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once("ready", () => {
    console.log("Ready!");
});

client.on("message", message => {

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    try {
        if (message.channel.id == storage.channelId && !message.content.startsWith(prefix) && !message.author.bot) {
            if (parseInt(commandName, 10) == storage.lastNumber + 1) {
                return;
            } else {
                // Specify by mentioning the user
                message.channel.send("Someone messed up!");
                return;
            }
        }
    } catch (err) {
        message.channel.send(`Set a channel for counting by using ${prefix}usechannel`);
    }

    if (!message.content.startsWith(prefix) || message.author.bot) return;

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