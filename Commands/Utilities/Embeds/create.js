const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'embedcreate',
    aliases: ['createembed', 'ecreate'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[channel] (options)'],
        content: 'Creates a custom embed'
    },
    clientPermissions: ['EMBED_LINKS'],
    userPermissions: ['SEND_MESSAGES']
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
            match: 'rest'
        }

        let [arr, embed] = [options.split(';'), {}];
        for(let arg of arr) {
            const [option, value] = [arg.split(':')[0].trim().toLowerCase(), arg.split(':').slice(1).join(':')];
            console.log({option: option, value: value})
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

        console.log(args.embed)
        await args.channel.send({embed: args.embed})
        return message.react('👌')

    };
};

module.exports = EmbedCreateCommand;