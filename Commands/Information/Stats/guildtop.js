const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'servertop',
    aliases: ['guilds', 'guildlb', 'servers', 'guildtop', 'serverlb', 'gtop'],
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
                    ['MEMBERS', 'MEMBER'],
                    ['JOINED', 'JOIN']
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
        let [mention, start, end, page, sort] = [null, 0, 0, args.page, 0];
        function displayValue() {}; function sortValues() {};

        switch(args.category.toUpperCase()) {

            case 'COUNT':

                data = (await this.client.db.query(`SELECT guild_id, counting_count, leaderboard_display FROM guilds WHERE counting_count > 0`)).rows;
                displayValue = function displayValue(val) {
                    return `\`${client.functions.groupDigits(val)}\``;
                };
                break;
            case 'MESSAGES':

                data = (await this.client.db.query(`SELECT guilds.guild_id, SUM(messages), leaderboard_display FROM members JOIN guilds ON (guilds.guild_id = members.guild_id) GROUP BY guilds.guild_id`)).rows;
                displayValue = function displayValue(val) {
                    return `\`${client.functions.groupDigits(val)}\``
                };
                break;
            case 'VOICE':

                data = (await this.client.db.query(`SELECT guilds.guild_id, SUM(voice_minutes), leaderboard_display FROM members JOIN guilds ON (guilds.guild_id = members.guild_id) GROUP BY guilds.guild_id`)).rows;
                displayValue = function displayValue(val) {
                    return val > 600 ? `\`${client.functions.groupDigits(Math.round(val/60))} hours\`` : `\`${client.functions.groupDigits(Math.round(val/6)/10)} hours\``
                };
                break;
            case 'AGE':

                rawData = (await this.client.db.query(`SELECT guild_id, leaderboard_display FROM guilds`)).rows;
                for(let i = 0; i < rawData.length; i++) {

                    try{
                        data.push({
                            guild_id: rawData[i].guild_id,
                            created: (await client.guilds.fetch(rawData[i].guild_id)).createdTimestamp,
                            leaderboard_display: rawData[i].leaderboard_display
                        });
                    } catch(e) {
                        continue;
                    }

                };
                displayValue = function displayValue(val) {
                    return client.functions.since(val, 2)
                }
                sort = 1
                break;

            case 'MEMBERS':

                rawData = (await this.client.db.query(`SELECT guilds.guild_id, COUNT(user_id), leaderboard_display FROM members JOIN guilds ON (guilds.guild_id = members.guild_id) GROUP BY guilds.guild_id`)).rows;
                for(let i = 0; i < rawData.length; i++) {

                    try {
                        data.push({
                            guild_id: rawData[i].guild_id,
                            value: [Number(rawData[i].count), (await (await client.guilds.fetch(rawData[i].guild_id)).members.fetch()).filter(m => !m.user.bot).size],
                            leaderboard_display: rawData[i].leaderboard_display
                        });
                    } catch {
                        data.push({
                            guild_id: rawData[i].guild_id,
                            value: [Number(rawData[i].count)],
                            leaderboard_display: rawData[i].leaderboard_display
                        });
                    }

                };
                displayValue = function displayValue(val) {
                    if(val[1]) {
                        return `\`${client.functions.groupDigits(val[1])}\` | \`${client.functions.groupDigits(val[0])} recorded\``;
                    } else {
                        return `\`${client.functions.groupDigits(val[0])} recorded\``
                    }
                };
                sortValues = function sortValues(a, b) {
                    [a, b] = [Object.values(a)[1], Object.values(b)[1]]
                    b = b[1] ? b[1] : b[0];
                    a = a[1] ? a[1] : a[0];
                    return b-a;
                }; sort = 2
                break;
            
            case 'JOINED':

                rawData = (await this.client.db.query(`SELECT guild_id, leaderboard_display FROM guilds`)).rows;
                for(let i = 0; i < rawData.length; i++) {

                    try{
                        data.push({
                            guild_id: rawData[i].guild_id,
                            joined: (await client.guilds.fetch(rawData[i].guild_id)).joinedTimestamp,
                            leaderboard_display: rawData[i].leaderboard_display
                        })
                    } catch {
                        continue;
                    }

                };
                displayValue = function displayValue(val) {
                    return client.functions.since(val, 2)
                };
                sort = 1;
                break;
            default:
                return message.reply('An error occurred.')
        };
        
        data.filter(g => g.leaderboard_display == 2)
        if(sort === 0) {

            data.sort((a, b) => Object.values(b)[1] - Object.values(a)[1])

        } else if(sort === 1) {

            data.sort((a, b) => Object.values(a)[1] - Object.values(b)[1])
        
        } else if(sort === 2) {

            data.sort((a, b) => sortValues(a, b))

        }        

        let arr = [];
        let perPage = 10;

        start += perPage*(page-1); end += (perPage*(page))-1;
        if(start > data.length) return message.reply('No data.')
        if(end >= data.length-1) end = data.length-1;

        for(let i = start; i <= end; i++) {
            if(i >= data.length) break;
            
            if(data[i].leaderboard_display == 1) {
                mention = '**`ANONYMOUS SERVER`**';
            } else if(data[i].leaderboard_display == 0) {
                try{
                    mention = `**${(await client.guilds.fetch(data[i].guild_id)).name}**`;
                } catch(error) {
                    mention = '`Unknown Server`'
                }
            } else {
                continue;
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