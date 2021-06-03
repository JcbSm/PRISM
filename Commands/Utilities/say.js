const  { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'say',
    aliases: [],
    channel: 'guild',
    typing: true,
    description: {
        usage: ['"[message]" (text-channel)'],
        content: 'Echoes a message sent by the user in either the specified channel or the same channel.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class SayCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const text = yield {
            type: 'string',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this);
                }
            }
        };

        const channel = yield {
            type: 'textChannel',
            default: message => message.channel
        };

        return { text, channel }

    };

    async exec(message, args) {

        if(args.channel.permissionsFor(message.author.id).has('SEND_MESSAGES') && args.channel.permissionsFor(message.author.id).has('VIEW_CHANNEL')) {
            
            await args.channel.id === message.channel.id ? message.delete() : message.react('👌')
            return args.channel.send(args.text);

        } else {
            args.channel.permissionsFor(message.author.id).has('VIEW_CHANNEL') ? this.handler.emit('missingPermissions', message, this, 'user', ['SEND_MESSAGES']) : this.handler.emit('missingPermissions', message, this, 'user', ['VIEW_CHANNEL'])
        }
    };
};

module.exports = SayCommand;