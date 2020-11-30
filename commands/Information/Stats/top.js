const { Command } = require('discord-akairo');

class TopCommand extends Command {
    constructor() {
        super('top', {
            aliases: ['top', 'leaderboard'],
            description: {

            },
            category: 'information',
            channel: 'guild',
            typing: true,
            args: [
                {
                    id: 'category',
                    type: [
                        ['MESSAGES', 'MESSAGE'],
                        ['VOICE', 'VC'],
                        ['MUTED', 'MUTE'],
                        ['AFK']
                    ],
                    default: 'MESSAGES'
                },
                {
                    id: 'page',
                    default: 1
                }
            ]
        });
    };

    async exec(message, args) {

        let [data, client] = [null, this.client]
        let [mention, start, end, page] = [null, 0, 0, args.page];
        function displayValue() {};

        switch(args.category.toUpperCase()) {

            case 'MESSAGES':
                data = (await this.client.db.query(`SELECT user_id, messages FROM members WHERE guild_id = ${message.guild.id}`)).rows;
                displayValue = function displayValue(val) {
                    return `\`${client.functions.groupDigits(val)}\``;
                };
                break;
            case 'VOICE':
                data = (await this.client.db.query(`SELECT user_id, voice_minutes FROM members WHERE guild_id = ${message.guild.id}`)).rows;
                displayValue = function displayValue(val) {
                    if(val > 6000) return `\`${client.functions.groupDigits(Math.round(val/60))} hours\``
                    else if(val > 120) return `\`${Math.round(val/6)/10} hours\``
                    else return `\`${val} minutes\``
                };
                break;
            case 'MUTED': 
                data = (await this.client.db.query(`SELECT user_id, mute_minutes FROM members WHERE guild_id = ${message.guild.id}`)).rows;
                displayValue = function displayValue(va) {
                    if(val > 6000) return `\`${client.functions.groupDigits(Math.round(val/60))} hours\``
                    else if(val > 120) return `\`${Math.round(val/6)/10} hours\``
                    else return `\`${val} minutes\``
                };
                break;
            case 'AFK':
                data = (await this.client.db.query(`SELECT user_id, afk_count FROM members WHERE guild_id = ${message.guild.id}`)).rows;
                displayValue = function displayValue(val) {
                    return `\`${client.functions.groupDigits(val)}\``;
                };
                break;
            default:
                return message.reply('An error occurred.')
        };

        data.sort((a, b) => Object.values(b)[1] - Object.values(a)[1])

        let arr = [];

        start += 10*(page-1); end += (10*(page))-1;
        if(start > data.length) return message.reply('No data.')
        if(end >= data.length-1) end = data.length-1;

        for(let i = start; i <= end; i++) {
            if(i >= data.length) break;
            try{
                mention = await message.guild.members.fetch(data[i].user_id);
            } catch(error) {
                mention = (await this.client.users.fetch(data[i].user_id)).tag;
            }
            arr.push(`\`${client.functions.pad(i+1, 2)}.\` ${mention} • ${displayValue(Object.values(data[i])[1])}`)
        };
        
        message.channel.send({ embed: {
            title: `${message.guild.name.toUpperCase()} LEADERBOARD`,
            description: `*${args.category}:*\n${arr.join('\n')}`,
            footer: {
                text: `Page ${page} | ${start+1} - ${end+1} of ${data.length}`
            },
            thumbnail: {
                url: message.guild.iconURL()
            },
            timestamp: Date.now()
        }})
    };
};

module.exports = TopCommand;