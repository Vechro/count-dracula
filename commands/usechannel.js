const fs = require('fs');

module.exports = {
    name: 'usechannel',
    description: 'Specify a channel to be used for counting.',
    aliases: ['setchannel'],
    execute(message, args) {
        // ideally would export this data to json
        // channelName = args[0];
        const channelName = message.mentions.channels.first();
        const countStart = args[1];

        fs.writeFileSync('./data/data.json', 'utf8');

        channelName.send("Channel set for counting");
    },
};