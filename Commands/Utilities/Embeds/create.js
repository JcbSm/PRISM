const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'embedcreate',
    aliases: ['createembed', 'ecreate'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[channel] (options)'],
        content: 'Creates a custom embed'
    },
    clientPermissions: ['EMBED_LINKS'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class EmbedCreateCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const channel = yield {
            type: 'textChannel',
            prompt: this.client.functions.helpPrompt(message, this)
        }

        return { channel }

    };

    async exec(message, args) {

    };
};

module.exports = EmbedCreateCommand;