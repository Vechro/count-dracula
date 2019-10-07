module.exports = {
    name: 'beep',
    description: 'Beep!',
    aliases: ['boop'],
    execute(message) {
        message.channel.send('Boop.');
    },
};