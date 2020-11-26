const { Command } = require('discord-akairo');

class DebugCommand extends Command {
    constructor() {
        super('debug', {
            aliases: ['debug', 'test'],
            args: [
                {
                    id: 'str',
                    match: 'rest'
                }
            ],
            ownerOnly: true,
        });
    };

    async exec(message, args) {
        
    };
};

module.exports = DebugCommand;