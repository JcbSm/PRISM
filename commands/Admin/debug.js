const { Command } = require('discord-akairo');

class DebugCommand extends Command {
    constructor() {
        super('debug', {
            aliases: ['debug', 'test'],
            args: [
                {
                    id: 'str'
                }
            ],
            ownerOnly: true,
        });
    };

    async exec(message, args) {

        console.log(__dirname.split('\\')[__dirname.split('\\').length-1])

        
    };
};

module.exports = DebugCommand;