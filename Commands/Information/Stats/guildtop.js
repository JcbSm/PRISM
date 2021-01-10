const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'servertop',
    aliases: ['guilds', 'guildlb', 'servers', 'guildtop', 'serverlb'],
    description: {
        usage: ['[category]'],
        content: 'Show server leaderboards',
        argumentOptions: [
            {
                id: 'category',
                options: [
                    ['MESSAGES'],
                    ['VOICE'],
                    ['COUNT', 'COUNTS', 'COUNTING'],
                    ['AGE'],
                    ['MEMBERS', 'MEMBER']
                ]
            }
        ]
    },
    channel: null,
    typing: true,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: [],
}, __dirname)

class GuildTopCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const category = yield {
            
            type: commandInfo.description.argumentOptions[0].options,
            prompt: {
                start: message => {
                    this.client.emit('help', message, this)
                },
                retry: message => {
                    this.client.emit('help', message, this)
                }
            }

        };

        let page = yield {
            default: 1,
            type: 'integer'
        };

        return { category, page }

    };

    async exec(message, args) {

        let [data, rawData, client] = [[], [], this.client]
        let [mention, start, end, page, sort] = [null, 0, 0, args.page, undefined];
        function displayValue() {};

        switch(args.category.toUpperCase()) {

            case 'COUNT':

                data = (await this.client.db.query(`SELECT guild_id, counting_count FROM guilds WHERE counting_count > 0`)).rows;
                displayValue = function displayValue(val) {
                    return `\`${client.functions.groupDigits(val)}\``;
                };
                break;
            case 'MESSAGES':

                data = (await this.client.db.query(`SELECT guild_id, SUM(messages) FROM members GROUP BY guild_id`)).rows;
                displayValue = function displayValue(val) {
                    return `\`${client.functions.groupDigits(val)}\``
                };
                break;
            case 'VOICE':

                data = (await this.client.db.query(`SELECT guild_id, SUM(voice_minutes) FROM members GROUP BY guild_id`)).rows;
                displayValue = function displayValue(val) {
                    return val > 600 ? `\`${client.functions.groupDigits(Math.round(val/60))} hours\`` : `\`${client.functions.groupDigits(Math.round(val/6)/10)} hours\``
                };
                break;
            case 'AGE':

                rawData = (await this.client.db.query(`SELECT guild_id FROM guilds`)).rows;
                for(let i = 0; i < rawData.length; i++) {

                    try{
                        data.push({
                            guild_id: rawData[i].guild_id,
                            created: (await client.guilds.fetch(rawData[i].guild_id)).createdTimestamp
                        });
                    } catch(e) {
                        continue;
                    }

                };
                displayValue = function displayValue(val) {
                    return client.functions.since(val, 2)
                }
                sort = 'ascend'
                break;

            case 'MEMBERS':

                rawData = (await this.client.db.query(`SELECT guild_id, COUNT(user_id) FROM members GROUP BY guild_id`)).rows;
                for(let i = 0; i < rawData.length; i++) {

                    try {
                        data.push({
                            guild_id: rawData[i].guild_id,
                            value: [rawData[i].count, (await (await client.guilds.fetch(rawData[i].guild_id)).members.fetch()).size]
                        });
                    } catch {
                        data.push({
                            guild_id: rawData[i].guild_id,
                            value: [rawData[i].count]
                        });
                    }

                };
                displayValue = function displayValue(val) {
                    if(val[1]) {
                        return `\`${client.functions.groupDigits(val[0])}\` | \`${client.functions.groupDigits(val[1])}\``;
                    } else {
                        return `\`${client.functions.groupDigits(val[0])}\``
                    }
                };
                break;
            default:
                return message.reply('An error occurred.')
        };
        
        console.log(data)

        if(sort === 'ascend') {
            data.sort((a, b) => Object.values(a)[1] - Object.values(b)[1])
        } else {
            data.sort((a, b) => Object.values(b)[1] - Object.values(a)[1])
        }

        let arr = [];

        start += 10*(page-1); end += (10*(page))-1;
        if(start > data.length) return message.reply('No data.')
        if(end >= data.length-1) end = data.length-1;

        for(let i = start; i <= end; i++) {
            if(i >= data.length) break;
            try{
                mention = `**${(await client.guilds.fetch(data[i].guild_id)).name}**`;
            } catch(error) {
                mention = '`Unknown Server`'
            }
            arr.push(`\`${client.functions.pad(i+1, 2)}.\` ${mention} • ${displayValue(Object.values(data[i])[1])}`)
        };
        
        return message.channel.send({ embed: {
            
            title: `${this.client.user.username.toUpperCase()} SERVER LEADERBOARD`,
            description: `*${args.category}:*\n${arr.join('\n')}`,
            footer: {
                text: `Page ${page} | ${start+1} - ${end+1} of ${data.length}`
            },
            thumbnail: {
                url: this.client.user.displayAvatarURL()
            },
            timestamp: Date.now(),
            color: await this.client.config.colors.embed(message.guild)

        }})

    }; 
};

module.exports = GuildTopCommand;