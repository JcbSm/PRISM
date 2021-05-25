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
        
        let client = this.client;

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
                            description: `Type the name or ID of a background to select it.`,
                            image: {
                                url: 'attachment://backgrounds.png'
                            }
                        };
                        Object.assign(embed, defaultOptions);

                        value = yield {
                            type: (message, phrase) => {
                                return bgs.find(bg => bg.id === phrase.toLowerCase() || bg.name === phrase.toLowerCase())
                            },
                            prompt: {

                                start: async () => {
                                    return { embed: embed, files: [{
                                        attachment: (await client.config.previewBackgrounds()).url,
                                        name: 'backgrounds.png'
                                    }] };
                                },
                                retry: async () => {
                                    return { embed: embed, files: [{
                                        attachment: (await client.config.previewBackgrounds()).url,
                                        name: 'backgrounds.png'
                                    }]};
                                },
                                cancel: () => {
                                    return { embed: {
                                        title: 'COMMAND CANCELLED',
                                        description: '`Cancelled by User.`',
                                        timestamp: Date.now(),
                                        color: client.config.colors.red
                                    }};
                                },
                                ended: () => {
                                    return { embed: {
                                        title: 'COMMAND CANCELLED',
                                        description: 'Invalid Input.\n`Retry limit exceeded.`',
                                        timestamp: Date.now(),
                                        color: client.config.colors.red
                                    }};
                                },
                                timeout: () => {
                                    return { embed: {
                                        title: 'COMMAND CANCELLED',
                                        description: `Timed Out.\n\`[${client.functions.UCT()}]\``,
                                        timestamp: Date.now(),
                                        color: client.config.colors.red
                                    }};
                                },
                                retries: 5,
                                time: 60*1000,
                            }
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

        let embed = {
            color: await this.client.config.colors.embed(message.guild)
        };

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

                value ? embed.color = this.client.functions.resolveHex(value) === '#FFFFFF' ? '#FCFCFC' : this.client.functions.resolveHex(value) : null

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

        
        embed.description =  `Set **${option.toUpperCase()}** to **${value}**`;

        message.channel.send({ embed: embed });
        
    };
};

module.exports = RankCardCommand;


