const jsonfile = require('jsonfile');


module.exports = {
    name: 'rules',
    description: 'List or modify existing rules.',
    aliases: ['rule'],
    execute(message, args, storage) {
        console.log(args);
        if (!args.length) {
            message.channel.send(JSON.stringify(storage.rules, null, 2));
            return;
        }

        jsonfile.writeFile(process.env.DATA_PATH, storage);
    }
};