const roman = require("romanjs");
const jsonfile = require("jsonfile");
const moment = require("moment");
const { path } = require("./config.json");

// Export most functions for use in index.js
module.exports = {
    setUserRestriction,
    convertToBase10,
    ban,
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// State should be true, false or null (unset)
function setUserRestriction(client, guildId, channelId, userId, state) {
    const guild = client.guilds.get(guildId);
    const channel = guild.channels.get(channelId);
    guild.fetchMember(userId).then((member) => {
        channel.overwritePermissions(member.user, { "SEND_MESSAGES": state }, "Restrict access to the designated counting channel.");
        if (state === false) {
            console.log(`${member.user.tag} (${userId}) restricted from accessing channel`);
        } else {
            console.log(`${member.user.tag} (${userId}) unrestricted from accessing channel`);
        }
    }, (err) => {
        console.error(err);
    }).catch(console.error);
}

// Converts string from either base-10, binary, hex, roman and returns the number in base-10 or NaN
function convertToBase10(string) {
    if (parseInt(string, 10)) {
        return parseInt(string, 10);
    } else if (string === "0" || string === "1") {
        return NaN;
    } else if (string.startsWith("0b") && parseInt(string.substr(2), 2)) {
        return parseInt(string.substr(2), 2);
    } else if (roman.parseRoman(string)) {
        return roman.parseRoman(string);
    } else if (string.startsWith("0x") && parseInt(string, 16)) {
        return parseInt(string, 16);
    } else {
        return NaN;
    }
}

function ban(client, message, storage, rewind) {
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

    if (!rewind) {
        storage.lastUserId = 0;
        jsonfile.writeFileSync(path, storage);
        message.channel.send(message.member + " messed up!");
        message.channel.send(storage.lastNumber);
        return;
    } else {
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
}

// Fibonacci used for calculating ban times from counting
function fibonacci(num) {
    let a = 1, b = 0, temp;

    while (num >= 0) {
        temp = a;
        a = a + b;
        b = temp;
        num--;
    }

    return b;
}