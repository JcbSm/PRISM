const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');
const fs = require('fs')

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
        const defaultOptions = await this.client.config.presets.defaultOptions(message.guild);

        let options = [
            ['COLOR', 'COLOUR', '1'],
            ['BACKGROUND', 'BG', '2']
        ];

        const option = yield {
            type: options,
            prompt: prompt(optionEmbed(options, defaultOptions))
            
        };

        let [optionTwo, value] = [];

        switch (option) {

            case 'COLOR':
                
                let embed = {
                    title: 'RANKCARD COLORS',
                    description: 'Type `view` to view your current colour.\n\nType `reset`/`default` to set it back to the server default.\n\nOr type a new color.'
                }
                Object.assign(embed, defaultOptions);

                value = yield {
                    match: 'rest',
                    prompt: prompt(embed)
                };

                value = value.toUpperCase();

                break;
            
            case 'BACKGROUND':

                options = [
                    ['SET', '1'],
                    ['REMOVE', 'RM', '2']
                ]

                optionTwo = yield {
                    type: options,
                    prompt: prompt(optionEmbed(options, defaultOptions))
                    
                };

                switch (optionTwo) {

                    case 'SET':

                        const bgs = this.client.config.backgrounds();

                        let embed = {
                            title: 'SELECT NEW BACKGROUND',
                            description: `${bgs.map(bg => `\`${bg.id}\` • ${bg.name.toUpperCase()}`).join('\n')}`
                        };
                        Object.assign(embed, defaultOptions);

                        value = yield {
                            type: (message, phrase) => {
                                return bgs.find(bg => bg.id === phrase.toLowerCase() || bg.name === phrase.toLowerCase())
                            },
                            prompt: prompt(embed)
                        }

                        break;

                    case 'REMOVE':

                        break;

                }

                break;
        
            default:
                break;
        }

        return { option, optionTwo, value }
    };

    async exec(message, { option, optionTwo, value }) {

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

                if(value === 'NULL' || value === 'DEFAULT' || value === 'RESET') {
                    await this.client.db.query(`UPDATE members SET rank_card_color = null WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)
                    value = null
                } else {

                    let color = this.client.functions.resolveHex(value);

                    if(color) {
                        await this.client.db.query(`UPDATE members SET rank_card_color = '${color}' WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`, (err, res) => {
                            //console.log(err, res)
                        });
                        value = color
                    } else {
                        return message.reply('Invalid colour.')
                    }
                }

                break;
            
            case 'BACKGROUND':

                switch (optionTwo) {

                    case 'SET':

                        await this.client.db.query(`UPDATE members SET rank_card_bg_id = ${value.id} WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`);
                        value = `\`${value.id}\` • ${value.name.toUpperCase()}`

                        break;

                    case 'REMOVE':

                        await this.client.db.query(`UPDATE members SET rank_card_bg_id = 0 WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`);
                        value = `\`null\``

                        break; 

                }
        };

        let embed = {
            description: `Set **${option.toUpperCase()}** to **${value}**`,
            color: await this.client.config.colors.embed(message.guild)
        };

        if(option === 'COLOR') value ? embed.color = this.client.functions.resolveHex(value) === '#FFFFFF' ? '#FCFCFC' : this.client.functions.resolveHex(value) : null

        message.channel.send({ embed: embed });
        
    };
};

module.exports = RankCardCommand;


