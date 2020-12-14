const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'roll',
    aliases: [],
    description: {
        usage: ['(max)'],
        content: 'Roll a dice.'
    },
    channel: null,
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: [],
}, __dirname)

class RollCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const max = yield {
            type: 'integer',
            default: 6
        }

        return { max }
    };

    async exec(message, { max }) {

        max > 0 ? message.reply(`you rolled a ${Math.ceil(Math.random()*max)}. 🎲`) : message.reply('Invalid Input')
    };
};

module.exports = RollCommand;