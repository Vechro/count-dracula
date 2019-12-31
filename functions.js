const roman = require("romanjs");

// Export most functions for use in index.js
module.exports = {
    getRandom,
    setUserRestriction,
    getOldestMessageNumber,
    fibonacci,
    convertToBase10,
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

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
            console.log(`${member.user.username} (${userId}) restricted from accessing channel`);
        } else {
            console.log(`${member.user.username} (${userId}) unrestricted from accessing channel`);
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

// This takes care of deleted and edited messages
async function getOldestMessageNumber(client, message, channelId, limitAmount) {
    const channel = getChannel(client, message.guild.id, channelId);
    // TODO: Ignore commands and bot if it's not a number

    const sortedMessages = await channel.fetchMessages({ limit: limitAmount, before: message.id })
        .then(messages => {
            return messages.sort((a, b) => a.createdAt > b.createdAt);
        });

    const oldestMessage = sortedMessages.last();

    // Checks if oldest message in Collection has been edited
    if (oldestMessage.editedTimestamp > 0) {
        // Unreliable, edits array tends to remain empty no matter what, keeping it around just in case
        if (oldestMessage._edits.length > 0) {
            console.log("Preceding message has edits cache, finding oldest message...");
            const editedMessages = oldestMessage.edits;
            const originalMessage = editedMessages[editedMessages.length - 1];
            const countAttempt = originalMessage.content.split(/ +/)[0];
            const interpreted = convertToBase10(countAttempt, limitAmount - 1);
            if (interpreted) {
                return interpreted;
            } else {
                return getOldestMessageNumber(client, message, channelId, limitAmount + 1);
            }
        } else {
            // BRB = Bad Recursion BRB
            // TODO: Could be optimized by passing in a new message.id
            return getOldestMessageNumber(client, message, channelId, limitAmount + 1);
        }
    } else {
        const countAttempt = oldestMessage.content.split(/ +/)[0];
        const interpreted = convertToBase10(countAttempt, limitAmount - 1);
        if (interpreted) {
            return interpreted;
        } else {
            return getOldestMessageNumber(client, message, channelId, limitAmount + 1);
        }
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