const jsonfile = require('jsonfile');

module.exports = {
    name: 'setrule',
    description: 'Change a rule',
    aliases: ['rule'],
    usage: '<rule name> <true | false>',
    execute(message, args, storage) {

        const ruleName = args[0];
        const ruleStatus = args[1];
        let derivedBoolean;

        if (ruleStatus.toLowerCase() === 'true') {
            derivedBoolean = true;
        } else if (ruleStatus.toLowerCase() === 'false') {
            derivedBoolean = false;
        } else {
            message.channel.send('Unable to interpret rule state');
            return;
        }

        const knownRules = Object.keys(storage.rules);

        if (knownRules.includes(ruleName)) {
            storage.rules[ruleName] = derivedBoolean;
        } else {
            message.channel.send('Unable to find such rule');
            return;
        }

        jsonfile.writeFile(process.env.DATA_PATH, storage);
        message.channel.send('Rule changed');
    }
};