const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'help',
    aliases: [],
    channel: null,
    typing: false,
    description: {
        usage: ['', '(command)', '(category)'],
        content: 'Get help.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname)

class HelpCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        let [ input, category, command ] = [yield];

        if(this.handler.categories.map(c => c.id.toLowerCase()).includes(input.toLowerCase())) {
            category = this.handler.categories.get(this.client.functions.toTitleCase(input.toLowerCase()))
        } else if(this.handler.modules.map(c => c.id.toLocaleLowerCase()).includes(input.toLowerCase())) {
            command = this.handler.modules.get(input.toLowerCase())
        }

        return { category, command }
    };

    async exec(message, args) {

        if(args.category) {
            this.client.emit('help', message, null, args.category)
        } else if(args.command) {
            this.client.emit('help', message, args.command)
        }
    };
};

module.exports = HelpCommand;
