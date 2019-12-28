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
// TODO: Refactor it into convertToBase10 for easy comparisons to lastNumber
// TODO: eliminate edge cases and exploits as parseInt is super permissive
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

// Same as isValidInt but also returns the number in base-10 or null
function interpretInt(string) {
    console.log("string " + string);
    if (parseInt(string, 10)) {
        return parseInt(string, 10);
    } else if (string === "0" || string === "1") {
        return null;
    } else if (string.startsWith("0b") && parseInt(string.substr(2), 2)) {
        return parseInt(string.substr(2), 2);
    } else if (roman.parseRoman(string)) {
        return roman.parseRoman(string);
    } else if (string.startsWith("0x") && parseInt(string, 16)) {
        return parseInt(string, 16);
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
async function getPrecedingMessageNumber(client, message, channelId) {
    // console.log(beforeMessageId);
    const channel = getChannel(client, message.guild.id, channelId);
    // TODO: Ignore commands and bot if it's not a number
    const messages = await channel.fetchMessages({ limit: 1, before: message.id });
    const precedingMessage = messages.first();
    /*
    const editedMessages = precedingMessage.edits;
    console.log(editedMessages);
    */
    if (precedingMessage.edits) {
        const editedMessages = precedingMessage.edits;
        console.log(editedMessages);
        const originalMessage = editedMessages[editedMessages.length - 1];
        const countAttempt = originalMessage.content.split(/ +/)[0];
        return interpretInt(countAttempt);
    } else {
        const countAttempt = precedingMessage.content.split(/ +/)[0];
        return interpretInt(countAttempt);
    }
}

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