module.exports = {
    name: "dumpjson",
    description: "Dump all of the data in JSON.",
    dmOnly: true,
    execute(message, args, storage) {
        message.reply(JSON.stringify(storage, null, 2));
    },
};