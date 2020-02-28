module.exports = {
    name: "dumpjson",
    description: "Dump all of the data in JSON.",
    execute(message, args, storage) {
        message.channel.send(JSON.stringify(storage, null, 2), { split: true });
    },
};