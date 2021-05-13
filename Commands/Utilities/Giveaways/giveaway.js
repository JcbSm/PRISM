const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'giveaway',
    aliases: [],
    description: {
        usage: ['[prize]'],
        content: 'Giveaway a prize'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class GiveawayCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const prize = yield {
            type: 'string',
            match: 'rest',
            prompt: this.client.functions.helpPrompt(message, this)
        }

        return { prize }

    };

    async exec(message, args) {

        let sent = await message.channel.send({ embed: {
            title: 'GIVEAWAY',
            description: `\`\`\`${args.prize}\`\`\`\nReact with 🎉 to enter.`,
            color: await this.client.config.colors.embed(message.guild),
            timestamp: Date.now()
        }});

        await sent.react('🎉');

        await message.delete();

    };
};

module.exports = GiveawayCommand;