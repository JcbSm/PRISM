const { Command } = require('discord-akairo');
const { commandOptions } = require('../../config').functions;

const commandInfo = commandOptions({
    id: 'clear',
    aliases: [],
    description: {
        usage: ['[amount]'],
        content: 'Bulk delete messages'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['MANAGE_MESSAGES', 'SEND_MESSAGES'],
    userPermissions: ['MANAGE_MESSAGES'],
}, __dirname)

class ClearCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const amount = yield {

            type: 'integer',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this)
                }
            }
        };

        return { amount }
    }

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