const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'levels',
    aliases: ['levelstop', 'ranks'],
    channel: 'guild',
    typing: true,
    description: {
        usage: ['(page)', '(member)'],
        content: 'View the levels leaderboard for a server.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname)

class LevelsCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        let [page, number, type] = [];

        page = yield {

            default: 1
        };

        number = Number(page); if(isNaN(number)) type = 'string'; else { page = Math.round(page); type = 'integer' };

        return { page, type }
    }

    async exec(message, args) {
        
        const { levelCalc, pad, groupDigits } = this.client.functions;       

        const members = (await this.client.db.query(`SELECT user_id, xp FROM members WHERE guild_id = ${message.guild.id} AND xp > 0`)).rows;

        members.sort((a, b) => b.xp - a.xp);

        let arr = [];
        let [mention, start, end, page] = [null, 0, 0, null];

        if(args.type === 'string') {

            let member = this.client.util.resolveMember(args.page, message.guild.members.cache);

            if(member) {

                let index = members.findIndex(m => m.user_id === member.id)
                if(index >= 0 && index < members.length) {

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
        if(start > members.length) return message.reply('No data.')
        if(end >= members.length-1) end = members.length-1;

        for(let i = start; i <= end; i++) {
            if(i >= members.length) break;
            try{
                mention = await message.guild.members.fetch(members[i].user_id);
            } catch(error) {
                mention = (await this.client.users.fetch(members[i].user_id)).tag;
            }
            arr.push(`\`${pad(i+1, 2)}.\`• \`Lvl [${pad(this.client.functions.levelCalc(members[i].xp), 2)}]\` • ${mention} • \`${groupDigits(members[i].xp)} xp\``);
        };

        message.channel.send({ embed: {
            title: `${message.guild.name.toUpperCase()} LEADERBOARD`,
            description: arr.join('\n'),
            footer: {
                text: `Page ${page} | ${start+1} - ${end+1} of ${members.length}`
            }
        }})
    };
};

module.exports = LevelsCommand;