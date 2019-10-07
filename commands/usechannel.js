module.exports = {
    name: 'usechannel',
    description: 'Specify a channel to be used for counting.',
    aliases: ['setchannel'],
    execute(message, args) {
        channelName = args[0];

    },
};