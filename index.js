const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();

// const storage = JSON.parse(fs.readFileSync('./data/data.json', 'utf8'));

let data = {
    counting: true,
    channelId: '',
    lastNumber: 0,
    users: [
        {
            userId: '',
            banishments: 0,
            unbanDate: 0,
        },
    ]
};

try {
    if (fs.existsSync(path)) {
        const storage = JSON.parse(fs.readFileSync('./data/data.json', 'utf8'));
    }
} catch (err) {
    const storage = data;
}

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log('Ready!');
});

client.on('message', message => {

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (message.channel.id == storage.channelId) {
        if (parseInt(commandName, 10) == storage.lastNumber + 1) {
            return;
        } else {
            message.channel.send('Someone fucked up!');
            return;
        }
    }

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply('I can\'t execute that command inside DMs!');
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
        message.reply('there was an error trying to execute that command!');
    }
});

client.login(token);