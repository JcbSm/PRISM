const { Command } = require('discord-akairo');
const { commandOptions } = require('../../config').functions;

const options = {
    id: 'debug',
    aliases: ['Bruh'],
    description: {

    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['ADMINISTRATOR']
};

const commandInfo = commandOptions(options, __dirname);

class DebugCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async exec(message, args) {
    
        console.log(this)
    };
};

module.exports = DebugCommand;