const roman = require("romanjs");

// Export most functions for use in index.js
module.exports = {
    getRandom,
    setUserRestriction,
    fibonacci,
    convertToBase10,
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// Unused
// Gets channel from channel id
function getChannel(client, guildId, channelId) {
    const guild = client.guilds.get(guildId);
    return guild.channels.get(channelId);
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
function convertToBase10(string, addInt = 0) {
    if (parseInt(string, 10)) {
        return parseInt(string, 10) + addInt;
    } else if (string === "0" || string === "1") {
        return NaN;
    } else if (string.startsWith("0b") && parseInt(string.substr(2), 2)) {
        return parseInt(string.substr(2), 2) + addInt;
    } else if (roman.parseRoman(string)) {
        return roman.parseRoman(string) + addInt;
    } else if (string.startsWith("0x") && parseInt(string, 16)) {
        return parseInt(string, 16) + addInt;
    } else {
        return NaN;
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