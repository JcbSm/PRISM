const { Command } = require('discord-akairo');

class LevelsCommand extends Command {
    constructor() {
        super('levels', {
            aliases: ['levels'],
            args: [
                {
                    id: 'page',
                    default: 1,
                }
            ],
            typing: true,
            category: 'information'
        });
    };

    async exec(message, args) {
        
        const { levelCalc, pad, groupDigits } = this.client.functions;       

        const members = (await this.client.db.query(`SELECT user_id, xp FROM members WHERE guild_id = ${message.guild.id} AND xp > 0`)).rows;

        members.sort((a, b) => b.xp - a.xp);

        let arr = [];
        let [mention, start, end, page] = [null, 0, 0, args.page];

        start += 10*(page-1); end += (10*(page))-1;

        if(end >= members.length-1) end = members.length-1;

        for(let i = start; i <= end; i++) {
            if(i >= members.length) break;
            try{
                mention = await message.guild.members.fetch(members[i].user_id);
            } catch(error) {
                mention = (await this.client.users.fetch(members[i].user_id)).tag;
            }
            arr.push(`\`${pad(i+1, 2)}.\`• \`Lvl [${pad(levelCalc(members[i].xp), 2)}]\` • ${mention} • \`${groupDigits(members[i].xp)} xp\``);
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