const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'draw',
    aliases: [],
    description: {
        usage: ['[message URL]'],
        content: 'Draw a member from a giveaway'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class DrawCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        message = yield {
            type: async (message, phrase) => {
                let resolved = await this.client.functions.resolveMessage(phrase);
                return resolved
            },
            match: 'rest',
            prompt: this.client.functions.helpPrompt(message, this)
        }

        return { message }

    };

    async exec(message, args) {

        let [reaction, prize] = [args.message.reactions.cache.get('🎉'), args.message.embeds[0].description.split('```')[1]];
        if(reaction.partial) reaction = await reaction.fetch();

        const entries = (await reaction.users.fetch()).filter(u => !u.bot)
        const winner = entries.get([...entries.keys()][Math.floor(Math.random() * entries.size)]);

        await message.channel.send(`**Congratulations to ${winner} for winning!! 🎉\`\`\`${prize}\`\`\`**`);
        await message.delete();

    };
};

module.exports = DrawCommand;