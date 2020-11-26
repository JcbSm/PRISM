const { Command } = require('discord-akairo');

class PingCommand extends Command {
    constructor() {
        super('ping', {
            aliases: ['ping']
        });
    };

    exec(message) {
        return message.reply('Pinging...').then(sent => {
            const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);
            return sent.edit(`${message.author}, Pong! \`${timeDiff} ms\``);
        });
    };
};

module.exports = PingCommand;