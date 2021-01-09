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
            type: 'channel',
            default: message => message.channel
        };

        return { text, channel }

    };

    async exec(message, args) {

        if(args.channel.type !== 'text') {
            return message.reply('Channel is not a text channel');
        }

        if(args.channel.permissionsFor(message.author.id).has('SEND_MESSAGES')) {
            
            await args.channel.id === message.channel.id ? message.delete() : message.react('👌')
            return args.channel.send(args.text);
        } else {
            this.handler.emit('missingPermissions', message, this, 'user', ['SEND_MESSAGES'])
        }
    };
};

module.exports = SayCommand;