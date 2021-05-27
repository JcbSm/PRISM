const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'embededit',
    aliases: ['editembed', 'eedit'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[message URL] [option] [value]'],
        content: 'Edits a custom embed',
        argumentOptions: [
            {
                id: 'option',
                options: [
                    ['TITLE' , '1'],
                    ['DESCRIPTION', 'DESC', '2'],
                    ['URL', '3'],
                    ['COLOR', 'COLOUR', '4'],
                    ['TIMESTAMP', 'TIME', '5'],
                    ['THUMBNAIL', '6'],
                    ['IMAGE', 'IMG', '7'],
                    ['FOOTER', '8']
                ]
            }
        ]
    },
    clientPermissions: ['EMBED_LINKS'],
    userPermissions: ['SEND_MESSAGES', 'EMBED_LINKS']
}, __dirname);

class EmbedEditCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        let client = this.client;
        const { prompt, optionEmbed, helpPrompt } = this.client.functions;

        const msg = yield {
            type: async (message, phrase) => {
                let msg = await client.functions.resolveMessage(phrase);
                if (msg.guild.id === message.guild.id && msg.author.id === client.user.id && msg.embeds[0]) {
                    if (msg.embeds[0].type === 'rich') return msg;
                } else {
                    return null;
                };
            },
            prompt: this.client.functions.helpPrompt(message, this)
        };

        let options = this.description.argumentOptions.find(arg => arg.id === 'option').options;

        const option = yield {
            type: options,
            prompt: prompt(optionEmbed(options, await this.client.config.presets.defaultOptions(message.guild)))
        }

        const value = yield {
            match: 'rest',
            prompt: prompt({
                title: 'SET VALUE',
                description: `Set a value for the embed ${option.toLowerCase()}`,
                footer: {
                    text: 'Type \'cancel\' to cancel.',
                },
                timestamp: Date.now(),
                color: await client.config.colors.embed(message.guild)
            })
        }

        message = msg;

        return { message, option, value };

    };

    async exec(message, args) {

        if(args.message.channel.permissionsFor(message.author.id).has('SEND_MESSAGES')) {
            
            try {

                let embed = args.message.embeds[0];
                console.log(embed)
                if (['IMAGE', 'THUMBNAIL'].includes(args.option)) {
                    embed[args.option.toLowerCase()] = { url: args.value };
                } else if (['FOOTER'].includes(args.option)) {
                    embed[args.option.toLowerCase()] = { text: args.value };
                } else {
                    embed[args.option.toLowerCase()] = args.value;
                }
                await args.message.edit({ embed: embed })
                return message.react('👌')

            } catch (e) {
                console.log(e)
                return message.channel.send({ embed: {
                    description: '`ERROR: Invalid value`',
                    color: this.client.config.colors.red
                }});
            }

        } else {
            this.handler.emit('missingPermissions', message, this, 'user', ['SEND_MESSAGES'])
        };
    };
};

module.exports = EmbedEditCommand;