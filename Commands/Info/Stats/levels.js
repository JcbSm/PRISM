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
        
        let client = this.client;
        const { pad, groupDigits, levelCalc } = this.client.functions;    

        let members = (await this.client.db.query(`SELECT user_id, xp FROM members WHERE guild_id = ${message.guild.id} AND xp > 0`)).rows;

        members.sort((a, b) => b.xp - a.xp);

        let page;
        let maxPage = Math.ceil(members.length / 10);

        // Parse page
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
            page = args.page <= maxPage ? args.page : 1;
        }

        async function generateEmbed(page) {

            let newMembers = [...members]; // Avoid mutation when splicing

            let embed = {
                title: `${message.guild.name.toUpperCase()} LEADERBOARD`,
                color: await client.config.colors.embed(message.guild)
            };

            let start = 10 * (page - 1);
            let pageMembers = newMembers.splice(start, 10);

            let i = start; let arr = []; let mention;

            for (const member of pageMembers) {
                try {
                    mention = await message.guild.members.fetch(member.user_id);
                } catch (error) {
                    try{
                        mention = (await client.users.fetch(member.user_id)).tag;
                    } catch (error) {
                        console.error(error)
                        mention = '`Deleted User`';
                    };
                };
                arr.push(`\`${pad(i+1, 2)}.\`• \`Lvl [${pad(levelCalc(member.xp), 2)}]\` • ${mention} • \`${groupDigits(member.xp)} xp\``)
                i++;
            };

            embed.description = arr.join('\n');
            embed.footer = {
                text: `Page: ${page} of ${maxPage}`
            }

            return embed

        };

        let sent = await message.channel.send({ embed: await generateEmbed(page)});

        await sent.react('⬆️');
        await sent.react('⬇️');

        const filter = (reaction, user) => {
            return reaction.emoji.name === '⬆️' || reaction.emoji.name === '⬇️' && user.id === message.author.id;
        };

        const collector = sent.createReactionCollector(filter, { time: 60 * 1000});
        
        collector.on('collect', async (reaction, user) => {
            let newPage = page
            if (reaction.emoji.name === '⬆️') {
                newPage -= 1;

                if (newPage > 0) {
                    page = newPage;
                    await sent.edit({ embed: await generateEmbed(page)});
                    await reaction.users.remove(user.id);
                } else {
                    reaction.users.remove(user.id);
                }

            } else if (reaction.emoji.name === '⬇️') {
                newPage += 1

                if (newPage <= maxPage) {
                    page = newPage;
                    await sent.edit({ embed: await generateEmbed(page)});
                    await reaction.users.remove(user.id);
                } else {
                    await reaction.users.remove(user.id);
                }
            }
        });
        
        collector.on('end', async () => {
            try {
                await sent.reactions.removeAll();
            } catch (error) {
                console.error(error)
            }
        });

    };
};

module.exports = LevelsCommand;