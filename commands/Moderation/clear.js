const { Command } = require('discord-akairo');

class ClearCommand extends Command {
    constructor() {
        super('clear', {
            aliases: ['clear'],
            description: {

            },
            category: 'moderation',
            channel: 'guild',
            typing: true,
            args: [
                {
                    id: 'amount',
                    type: 'integer'
                }
            ]
        });
    };

    async exec(message, args) {
        
        if(args.amount > 0 && args.amount < 100) {

            await message.channel.bulkDelete(Math.floor(args.amount)+1);
            let sent = await message.channel.send({ embed: {
                description: `✅ Cleared ${Math.floor(args.amount)} messages.`,
                color: this.client.config.colors.green
            }});
            setTimeout(() => sent.delete(), 10000);

        } else {
            message.reply('Please specify an amount between 1-99.')
        };
    };
};

module.exports = ClearCommand;