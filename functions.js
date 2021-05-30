const fs = require('fs');
const path = require('path');

const roman = require('@sguest/roman-js');
const jsonfile = require('jsonfile');
const { DateTime } = require('luxon');
const { Client, Message } = require('discord.js');

// Export most functions for use in index.js
module.exports = {
    restrictUser,
    convertToBase10,
    banishUser,
    createDirectories,
    pollUsers,
    initializeStorage,
    isValid
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// Unused but useful
// Gets channel from channel id
/*
function getChannel(client, guildId, channelId) {
    const guild = client.guilds.get(guildId);
    return guild.channels.get(channelId);
}
*/

// Checks if an int is within safe bounds
function isValid(value) {
    return value < Number.MAX_SAFE_INTEGER && value > Number.MIN_SAFE_INTEGER;
}

// State should be true to restrict, or false to unrestrict
async function restrictUser(client, channelId, userId, state) {
    const channel = await client.channels.fetch(channelId)
        .catch(error => console.error(error));

    // const guild = client.guilds.resolve(channel);
    const guild = channel.guild;

    guild.members.fetch(userId)
        .then(member => {
            if (state) {
                channel.overwritePermissions([{ id: member.user, deny: ['SEND_MESSAGES'] }], 'Forbid access to the designated counting channel.');
                console.log(`${member.user.tag} (${userId}) restricted from accessing channel`);
            } else {
            // TODO: Make this delete permissionOverwrites for a user instead
                channel.overwritePermissions([{ id: member.user, allow: ['SEND_MESSAGES'] }], 'Allow access to the designated counting channel.');
                console.log(`${member.user.tag} (${userId}) unrestricted from accessing channel`);
            }
        })
        .catch(error => console.error(error));
}

// This function unbans anyone who should be unbanned according to their unbanDate
function pollUsers(client, storage) {
    const currentTime = DateTime.local();

    for (const [user, id] of storage.users) {
        if (user.unbanDate !== '0' && DateTime.fromISO(user.unbanDate) < currentTime) {
            // Unban user
            restrictUser(client, storage.channelId, id, false);
            user.unbanDate = '0';
        }
    }
}

function initializeStorage(storage) {
    storage.users = new Map(storage.users);

    storage.users.toJSON = function () {
        return [...storage.users.entries()];
    };

    return storage;
}

// Converts string from either base-10, binary, hex, roman and returns the number in base-10 or NaN
function convertToBase10(string) {
    if (parseInt(string, 10)) {
        return parseInt(string, 10);
    } else if (string === '0' || string === '1') {
        return NaN;
    } else if (string.startsWith('0b') && parseInt(string.substr(2), 2)) {
        return parseInt(string.substr(2), 2);
    } else if (roman.parseRoman(string)) {
        return roman.parseRoman(string);
    } else if (string.startsWith('0x') && parseInt(string, 16)) {
        return parseInt(string, 16);
    }
    return NaN;
}

/**
 * @param {Client} client
 * @param {Message} message
 * @param {Object} storage
 * @param {Boolean} rewind
 * @returns {void}
 */
function banishUser(client, message, storage, rewind) {
    // Ignores moderators from being punished by bot as it has no effect anyway
    if (!message.member.hasPermission('MANAGE_ROLES')) {
        if (storage.users.has(message.member.user.id)) {

            const user = storage.users.get(message.member.user.id);
            user.banishments += 1;
            user.unbanDate = DateTime.local().plus({ hours: Math.sqrt(Math.abs(storage.lastNumber)) * 0.33 + Math.pow(fibonacci(user.banishments + 1), 3.3) });
            restrictUser(client, storage.channelId, message.member.user.id, true);

        } else {
            storage.users.set(message.member.user.id, {
                banishments: 1,
                unbanDate: DateTime.local().plus({ hours: Math.sqrt(Math.abs(storage.lastNumber)) * 0.67 })
            });

            restrictUser(client, storage.channelId, message.member.user.id, true);
        }
        const unbanDate = storage.users.get(message.member.user.id).unbanDate;

        const timeDifference = unbanDate.diffNow(['hours']).as('hours');
        message.member.send(`You will be unbanned from counting in ~${timeDifference.toFixed(1)} hours`);
    }

    if (!rewind) {
        storage.lastUserId = 0;
        jsonfile.writeFile(process.env.DATA_PATH, storage);
        message.channel.send(`${message.member} messed up!`);
        message.channel.send(storage.lastNumber);
        return;
    }
    storage.lastUserId = 0;

    const randomFloat = getRandom(0.6, 0.8);
    const randomInt = getRandom(17, 37);

    let proposedNumber = storage.lastNumber * randomFloat;
    if (storage.lastNumber - proposedNumber > randomInt && proposedNumber - randomInt > 0) {
        proposedNumber = storage.lastNumber - randomInt;
    }

    message.channel.send(`${message.member} messed up!`);
    storage.lastNumber = Math.floor(proposedNumber);
    message.channel.send(storage.lastNumber);
    jsonfile.writeFile(process.env.DATA_PATH, storage);
}

// Fibonacci used for calculating ban times from counting
function fibonacci(num) {
    let a = 1;
    let b = 0;
    let temp;

    while (num >= 0) {
        temp = a;
        a += b;
        b = temp;
        // eslint-disable-next-line no-param-reassign
        num--;
    }

    return b;
}

// Shoutout to bit-less at https://stackoverflow.com/a/54137611
function createDirectories(pathname) {
    const dirname = path.resolve();
    const trimmedPath = pathname.replace(/^\.*\/|\/?[^/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
    fs.mkdir(path.resolve(dirname, trimmedPath), { recursive: true }, e => {
        if (e) {
            console.error(e);
        } else {
            console.log('DATA_PATH created/already exists');
        }
    });
}