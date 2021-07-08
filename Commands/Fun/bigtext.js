const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'bigtext',
    aliases: [],
    description: {
        content: 'Turn text into big text',
        usage: ['[text]'],
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class BigTextCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    * args(message) {

        const str = yield {
            match: 'rest',
            prompt: this.client.functions.helpPrompt(message, this)
        };

        return {str};

    };

    exec(message, { str }) {

        message.channel.send(str.split("").map(char => this.client.config.characters[char.toLowerCase()] || '').join(' '));
        message.delete();

    };

};

module.exports = BigTextCommand;