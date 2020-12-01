const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../config').functions;

const commandInfo = commandOptions({
    id: 'top',
    aliases: ['leaderboard', 'lb'],
    channel: 'guild',
    typing: true,
    description: {
        usage: ['[category] (page)', '[category] (member)'],
        content: 'View the leaderboard for certain stats.',
        argumentOptions: [
            {
                id: 'category',
                options: [
                    ['MESSAGES', 'MESSAGE'],
                    ['VOICE', 'VC'],
                    ['MUTED', 'MUTE'],
                    ['AFK']
                ]
            }
        ]
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname)

class TopCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const category = yield {

            type: [
                ['MESSAGES', 'MESSAGE'],
                ['VOICE', 'VC'],
                ['MUTED', 'MUTE'],
                ['AFK']
            ],
            default: 'MESSAGES',
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
            default: 1
        };

        let type;

        let number = Number(page); if(isNaN(number)) type = 'string'; else { page = Math.round(page); type = 'integer' };

        return { category, page, type }
    };

    async exec(message, args) {

        let [data, client] = [null, this.client]
        let [mention, start, end, page] = [null, 0, 0, null];
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

        if(args.type === 'string') {

            console.log(data)

            let member = this.client.util.resolveMember(args.page, message.guild.members.cache);

            if(member) {

                let index = data.findIndex(m => m.user_id === member.id)
                if(index >= 0 && index < data.length) {

                    console.log(index)
                    page = Math.ceil((index+1)/10)
                } else {
                    page = 1
                }
        
            } else {
                page = 1
            }
        } else {
            page = args.page
        }

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