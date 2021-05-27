const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'embedcreate',
    aliases: ['createembed', 'ecreate'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[channel] [options]'],
        content: 'Creates a custom embed\n\nOptions should be split as:\n`option: value; option2: value;`',
        argumentOptions: [
            {
                id: 'OPTIONS',
                options: [
                    ['TITLE'],
                    ['DESCRIPTION'],
                    ['COLOR'],
                    ['THUMBNAIL'],
                    ['IMAGE']
                ]
            }
        ]
    },
    clientPermissions: ['EMBED_LINKS'],
    userPermissions: ['SEND_MESSAGES', 'EMBED_LINKS']
}, __dirname);

class EmbedCreateCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const channel = yield {
            type: 'textChannel',
            prompt: this.client.functions.helpPrompt(message, this)
        }

        let options = yield {
            match: 'rest',
            prompt: this.client.functions.helpPrompt(message, this)
        }

        let [arr, embed] = [options.split(';'), {}];
        
        for(let arg of arr) {
            const [option, value] = [arg.split(':')[0].trim().toLowerCase(), arg.split(':').slice(1).join(':')];
            
            switch(option) {
                case 'title':
                    embed.title = value;
                    break;
                case 'desc':
                case 'description':
                    embed.description = value;
                    break;
                case 'color':
                case 'colour':
                    embed.color = this.client.functions.resolveHex(value.trim()) === '#FFFFFF' ? '#FCFCFC' : this.client.functions.resolveHex(value.trim());
                    break;
                case 'thumbnail':
                    embed.thumbnail = {url: value};
                    break;
                case 'image':
                    embed.image = {url: value};
                    break;
            }
        }

        if(!embed.color) embed.color = await this.client.config.colors.embed(message.guild)

        return { channel, embed }

    };

    async exec(message, args) {

        if(args.channel.permissionsFor(message.author.id).has('SEND_MESSAGES')) {
            
            try {
                await args.channel.send({embed: args.embed})
                return message.react('👌')
            } catch {
                return message.channel.send({ embed: {
                    description: '`ERROR: Invalid embed options`',
                    color: this.client.config.colors.red
                }});
            }

        } else {
            this.handler.emit('missingPermissions', message, this, 'user', ['SEND_MESSAGES'])
        };
    };
};

module.exports = EmbedCreateCommand;