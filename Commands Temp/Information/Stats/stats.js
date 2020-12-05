const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'stats',
    aliases: ['stat'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['(member)'],
        content: 'View the stats for a user'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname)

class StatsCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const member = yield {

            type: 'member',
            default: message => message.member

        }

        return { member }

    }

    async exec(message, args) {

        const data = (await this.client.db.query(`SELECT * FROM members WHERE user_id = ${args.member.id} AND guild_id = ${message.guild.id}`)).rows[0];

        if(!data) return message.reply('No data.');

        let [messages, voice, afk, muted, mutePercent] = [data.messages, data.voice_minutes, data.afk_count, data.mute_minutes];

        mutePercent = voice > 0 ? `\`${Math.round(10000*muted/voice)/100}%\`` : '';
        voice = voice >= 120 ? `\`${Math.round(voice/6)/10}\` hours` : `\`${voice}\` minutes`;
        muted = muted >= 600 ? `\`${Math.round(muted/6)/10}\` hours` : `\`${muted}\` minutes`;

        message.channel.send({ embed: {
            title: `${message.guild.name.toUpperCase()} STATS`,
            description: `**[${this.client.functions.levelCalc(data.xp)}] • ${args.member}**`,
            fields: [
                {
                    name: 'MESSAGES',
                    value: `\`${this.client.functions.groupDigits(messages)}\``,
                    inline: true,
                },
                this.client.config.presets.blankFieldInline,
                {
                    name: 'VOICE',
                    value: voice,
                    inline: true
                },
                {
                    name: 'AFK COUNT',
                    value:`\`${afk}\``,
                    inline: true
                },
                
                this.client.config.presets.blankFieldInline,
                {
                    name: 'MUTED',
                    value: `${muted}, ${mutePercent}`,
                    inline: true
                }
            ],
            thumbnail: {
                url: args.member.user.displayAvatarURL()
            }
        }});
    };
};

module.exports = StatsCommand;