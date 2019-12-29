const roman = require("romanjs");

module.exports = {
    getRandom,
    restrictUser,
    unrestrictUser,
    isValidInt,
    getPrecedingMessageNumber,
    fibonacci,
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

/*
function isValidInt(string, expectedInt) {
    if (parseInt(string, 10) === expectedInt) {
        return true;
    } else if (string === "0" || string === "1") {
        return false;
    // parseInt is lax with 0x but not with 0b so .substr() is necessary
    } else if (string.startsWith("0b") && parseInt(string.substr(2), 2) == expectedInt) {
        return true;
    } else if (roman.parseRoman(string) === expectedInt) {
        return true;
    } else if (string.startsWith("0x") && parseInt(string, 16) === expectedInt) {
        return true;
    } else {
        return false;
    }
}
*/

function isValidInt(input) { 
    const interpreted = interpretInt(input);
    return !isNaN(interpreted) && !Number.isNaN(input);
}

// Same as isValidInt but also returns the number in base-10 or NaN
function interpretInt(string, addInt = 0) {
    console.log("string " + string + " / addint " + addInt);

    if (parseInt(string, 10)) {
        return parseInt(string, 10) + addInt;
    } else if (string === "0" || string === "1") {
        return null;
    } else if (string.startsWith("0b") && parseInt(string.substr(2), 2)) {
        return parseInt(string.substr(2), 2) + addInt;
    } else if (roman.parseRoman(string)) {
        return roman.parseRoman(string) + addInt;
    } else if (string.startsWith("0x") && parseInt(string, 16)) {
        return parseInt(string, 16) + addInt;
    } else {
        return null;
    }
}

/*
// To be used as such, TODO: returns interpreted number which can be compared to refactored convertToBase10
verifyPrecedingMessage(...).then(function (messages) {
    console.log(`Received ${messages.size} messages`)
}, console.error)
*/
// Supposed to fix editing
// You should check if this function returns the same number as you provided it
async function getPrecedingMessageNumber(client, message, channelId, limitAmount) {
    const channel = getChannel(client, message.guild.id, channelId);
    // TODO: Ignore commands and bot if it's not a number

    const sortedMessages = await channel.fetchMessages({ limit: limitAmount, before: message.id })
        .then(messages => {
            return messages.sort((a, b) => a.createdAt > b.createdAt);
        });
    
    const precedingMessage = sortedMessages.last();

    if (precedingMessage.editedTimestamp > 0) {
        // Unreliable, edits array tends to remain empty no matter what, keeping it around just in case
        if (precedingMessage._edits.length > 0) {
            console.log("Preceding message has edits cache, finding oldest message...");
            const editedMessages = precedingMessage.edits;
            const originalMessage = editedMessages[editedMessages.length - 1];
            const countAttempt = originalMessage.content.split(/ +/)[0];
            return interpretInt(countAttempt, limitAmount - 1);
        } else {
            return getPrecedingMessageNumber(client, message, channelId, limitAmount + 1);
        }
    } else {
        const countAttempt = precedingMessage.content.split(/ +/)[0];
        return interpretInt(countAttempt, limitAmount - 1);
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