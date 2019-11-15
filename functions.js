const roman = require("romanjs");

module.exports = {
    getRandom,
    restrictUser,
    unrestrictUser,
    isValidInt,
    getPrecedingMessageNumber,
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

function getChannel(client, guildId, channelId) {
    const guild = client.guilds.get(guildId);
    return guild.channels.get(channelId);
}

function restrictUser(client, guildId, channelId, userId) {
    const guild = client.guilds.get(guildId);
    const channel = guild.channels.get(channelId);
    guild.fetchMember(userId).then((member) => {
        channel.overwritePermissions(member.user, { "SEND_MESSAGES": false }, "Restrict access to the designated counting channel.");
        console.log(`${userId} restricted from accessing channel`);
    }, (err) => {
        console.error(err);
    }).catch(console.error);
}

// TODO: Consolidate these two functions into one
function unrestrictUser(client, guildId, channelId, userId) {
    const guild = client.guilds.get(guildId);
    const channel = guild.channels.get(channelId);
    guild.fetchMember(userId).then((member) => {
        channel.overwritePermissions(member.user, { "SEND_MESSAGES": true }, "Restrict access to the designated counting channel.");
        console.log(`${userId} unrestricted from accessing channel`);
    }, (err) => {
        console.error(err);
    }).catch(console.error);
}

function isValidInt(string, expectedInt) {
    if (parseInt(string, 10) === expectedInt) {
        return true;
    }
    else if (string === "0" || string === "1") {
        return false;
    }
    else if (parseInt(string, 2) === expectedInt || roman.parseRoman(string) === expectedInt) {
        return true;
    } else if (string.startsWith("0x") && parseInt(string, 16) === expectedInt) {
        return true;
    } else {
        return false;
    }
}

/*
// Unused
function verifyPrecedingMessage(client, guildId, channelId, beforeMessageId, expectedNumber) {
    return new Promise((resolve, reject) => {
        const channel = getChannel(client, guildId, channelId);
        channel.fetchMessages({ limit: 1, before: beforeMessageId })
            .then((messages) => {
                const message = messages[0];
                const countAttempt = message.content.split(/ +/)[0];
                if (isValidInt(countAttempt, expectedNumber)) {
                    resolve("Verified");
                } else {
                    reject(Error("Failed"));
                }
            })
            .catch(console.error);
    });
}
*/

/*
// To be used as such, returns 
verifyPrecedingMessage(...).then(function (messages) {
    console.log(`Received ${messages.size} messages`)
}, console.error)
*/
// Supposed to fix editing
// You should check if this function returns the same number as you provided it
async function getPrecedingMessageNumber(client, guildId, channelId, beforeMessageId, expectedNumber) {
    const channel = getChannel(client, guildId, channelId);
    const messages = await channel.fetchMessages({ limit: 1, before: beforeMessageId });
    const message = messages.first();
    const countAttempt = message.content.split(/ +/)[0];
    // TODO: check if the message been edited instead
    if (!isValidInt(countAttempt, expectedNumber)) {
        return expectedNumber;
        // Very problematic since I have a feeling this won't spot deleted messages and will assume the message before
        // the deleted message edited theirs and will punish them
        // Ideally I'd keep track of the last message along with the last number
        // but that still wouldn't work if multiple people delete messages
        // I should instead just look at what the previous number is, which wouldn't be able to punish anyone
        // but it'd be pretty foolproof at not punishing innocents
    }

    return expectedNumber;
}