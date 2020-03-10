const fs = require("fs");
const path = require("path");

const roman = require("@sguest/roman-js");
const jsonfile = require("jsonfile");
const { DateTime } = require("luxon");

// Export most functions for use in index.js
module.exports = {
    setUserRestriction,
    convertToBase10,
    ban,
    createDirectories,
    pollUsers,
    initializeStorage,
};

function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

// State should be true, false or null (unset)
function setUserRestriction(client, channelId, userId, state) {
    const channel = client.channels.get(channelId);
    const guild = channel.guild;
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

// This function unbans anyone who should be unbanned according to their unbanDate
function pollUsers(client, storage) {
    const currentTime = DateTime.local();

    storage.users.forEach(function (user, id) {
        if (user.unbanDate !== "0" && DateTime.fromISO(user.unbanDate) < currentTime) {
            // Unban user
            setUserRestriction(client, storage.channelId, id, null);
            user.unbanDate = "0";
        }
    });
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
            user.unbanDate = DateTime.local().plus({ hours: Math.sqrt(Math.abs(storage.lastNumber)) * 0.33 + Math.pow(fibonacci(user.banishments + 1), 3.3) });
            setUserRestriction(client, storage.channelId, message.member.user.id, false);

        } else {
            storage.users.set(message.member.user.id, {
                banishments: 1,
                unbanDate: DateTime.local().plus({ hours: Math.sqrt(Math.abs(storage.lastNumber)) * 0.67 }),
            });

            setUserRestriction(client, storage.channelId, message.member.user.id, false);
        }
        const unbanDate = storage.users.get(message.member.user.id).unbanDate;
        message.member.send(`You will be unbanned from counting in ~${unbanDate.diff(DateTime.local(), "hours")}`);
    }

    if (!rewind) {
        storage.lastUserId = 0;
        jsonfile.writeFile(process.env.DATA_PATH, storage);
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
        jsonfile.writeFile(process.env.DATA_PATH, storage);
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

// Shoutout to bit-less at https://stackoverflow.com/a/54137611
function createDirectories(pathname) {
    const dirname = path.resolve();
    pathname = pathname.replace(/^\.*\/|\/?[^/]+\.[a-z]+|\/$/g, ""); // Remove leading directory markers, and remove ending /file-name.extension
    fs.mkdir(path.resolve(dirname, pathname), { recursive: true }, e => {
        if (e) {
            console.error(e);
        } else {
            console.log("DATA_PATH created/already exists");
        }
    });
}
