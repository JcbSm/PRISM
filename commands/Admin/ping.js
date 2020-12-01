const { Command } = require('discord-akairo');
const { commandOptions } = require('../../config').functions;

const commandInfo = commandOptions({
    id: 'ping',
    aliases: [],
    description: {
        usage: [''],
        content: 'Ping the bot!'
    },
    channel: null,
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: [],
}, __dirname)

class PingCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    exec(message) {
        return message.reply('Pinging...').then(sent => {
            const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);
            return sent.edit(`${message.author}, Pong! \`${timeDiff} ms\``);
        });
    };
};

module.exports = PingCommand;