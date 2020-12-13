const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'rankcard',
    aliases: ['rc'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[option] (value)'],
        content: 'Edit your rank card for this server',
        argumentOptions: [
            {
                id: 'option',
                options: [
                    ['COLOR', 'COLOUR']
                ]
            }
        ]
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class RankCardCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const { prompt, optionEmbed } = this.client.functions;
        const { defaultOptions } = this.client.config.presets;

        let options = [
            ['COLOR', 'COLOUR', '1']
        ];

        const option = yield {
            type: options,
            prompt: prompt(optionEmbed(options, await defaultOptions(message.guild)))
            
        };

        const value = yield {
            type: 'string',
            default: 'VIEW'
        };

        return { option, value }
    };

    async exec(message, { option, value }) {

        switch (option) {
            case 'COLOR':

                if(value === 'VIEW') {
                    let currentColor = (await this.client.db.query(`SELECT rank_card_color FROM members WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)).rows[0].rank_card_color;
                    return message.channel.send({ embed: {
                        title: 'CURRENT COLOR',
                        description: `\`${currentColor}\``,
                        color: currentColor === '#FFFFFF' ? '#FCFCFC' : currentColor

                    }})
                }

                if(value.toLowerCase() === 'null' || value.toLowerCase() === 'default' || value.toLowerCase() === 'reset') {
                    await this.client.db.query(`UPDATE members SET rank_card_color = null WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)
                    value = null
                } else {

                    let color = this.client.functions.resolveHex(value);

                    if(color) {
                        await this.client.db.query(`UPDATE members SET rank_card_color = '${color}' WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`, (err, res) => {
                            console.log(err, res)
                        });
                    } else {
                        return message.reply('Invalid colour.')
                    }
                }

                break;
        };

        let embed = {
            description: `Set **${option.toUpperCase()}** channel to **${value}**`,
            color: await this.client.config.colors.embed(message.guild)
        };

        if(option === 'COLOR') value ? embed.color = this.client.functions.resolveHex(value) === '#FFFFFF' ? '#FCFCFC' : this.client.functions.resolveHex(value) : null

        message.channel.send({ embed: embed});
        
    };
};

module.exports = RankCardCommand;


