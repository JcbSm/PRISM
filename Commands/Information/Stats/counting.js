const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'counting',
    aliases: ['countstat', 'counts'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['(member)'],
        content: 'View counting stats'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: [],
}, __dirname);

class CountingCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const member = yield {
            type: 'member',
            default: message => message.member
        };

        return { member }
    };

    async exec(message, { member }) {

        const data = (await this.client.db.query(`SELECT user_id, counting_counts, counting_last_message_url, counting_count FROM members JOIN guilds ON (guilds.guild_id = members.guild_id) WHERE members.guild_id = ${member.guild.id}`)).rows;
        const { counting_counts, counting_last_message_url, counting_count } = data.find(u => u.user_id === member.id);
        const [ lastCount, rank ] = [
            await this.client.functions.resolveMessage(counting_last_message_url),
            data.sort((a, b) => b.counting_counts - a.counting_counts).findIndex(u => u.user_id === member.id) + 1
        ];
        


        let embed =  {
            title: `${member.guild.name.toUpperCase()} COUNTING STATS`,
            description: `${member} has counted \`${counting_counts}\` times in **${member.guild.name}**.`,
            thumbnail: {
                url: member.user.displayAvatarURL()
            },
            timestamp: lastCount ? lastCount.createdTimestamp : Date.now(),
            footer: {
                text: lastCount ? 'Last counted' : ''
            },
            color: await this.client.config.colors.embed(member.guild),
            fields: [
                {
                    name: '% OF COUNTS',
                    value: `\`${Math.round((10000*counting_counts)/(counting_count))/100}%\``,
                    inline: true
                },
                {
                    name: 'RANK',
                    value: `\`${rank}\``,
                    inline: true
                }
            ]
        };

        lastCount ? embed.fields.push({
            name: 'LAST COUNT',
            value: `\`${lastCount.content}\` • [\`\[JUMP\]\`](${counting_last_message_url})`
        }) : null

        message.channel.send({embed: embed})
    };
};

module.exports = CountingCommand;