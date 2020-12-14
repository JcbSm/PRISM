const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'xp',
    aliases: ['xpstats', 'xps'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['(member)'],
        content: 'Check the xp stats of a member.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class XpCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const member = yield {
            type: 'member',
            match: 'rest',
            default: message => message.member
        };

        return { member }
    };

    async exec(message, args) {

        const { levelCalc, xpCalc, groupDigits } = this.client.functions;

        const { xp, xp_messages, xp_minutes } = (await this.client.db.query(`SELECT xp, xp_messages, xp_minutes FROM members WHERE user_id = ${args.member.id} AND guild_id = ${args.member.guild.id}`)).rows[0]
        const level = this.client.functions.levelCalc(xp);
        const [ max, min, current ] = [ xpCalc(level+1), xpCalc(level), xp-xpCalc(level) ];

        message.channel.send({ embed: {
            title: `LEVEL [${level}]`,
            description: `\`\`\`${groupDigits(current)} / ${groupDigits(max-min)}\`\`\``,
            fields: [
                {
                    name: 'TOTAL XP',
                    value: `\`${groupDigits(xp)}\``,
                    inline: true
                },
                {
                    name: 'REMAINING XP',
                    value: `\`${groupDigits(max-min-current)}\``,
                    inline: true
                },
                this.client.config.presets.blankFieldInline,
                {
                    name: 'MESSAGES',
                    value: `\`${groupDigits(xp_messages)}\``,
                    inline: true
                },
                {
                    name: 'VOICE',
                    value: `\`${groupDigits(xp_minutes)} minutes\``,
                    inline: true
                },
                this.client.config.presets.blankFieldInline
            ],
            thumbnail: {
                url: args.member.user.displayAvatarURL()
            },
            color: await this.client.config.colors.embed(message.guild)
        }})
        
    };
};

module.exports = XpCommand;