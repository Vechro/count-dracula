module.exports = {
    name: "dumpjson",
    description: "Dump all of the data in JSON.",
    guildOnly: true,
    execute(message, args, storage) {
        message.send(JSON.stringify(storage, null, 2), { split: true });
    },
};