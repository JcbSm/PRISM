const { Command } = require('discord-akairo');

class StatsCommand extends Command {
    constructor() {
        super('stats', {
            aliases: ['stats', 'stat'],
            args: [
                {
                    id: 'member',
                    type: 'member'
                }
            ],
            category: 'information'
        });
    };

    async exec(message, args) {

        const member = args.member ? args.member : message.member;
        const data = (await this.client.db.query(`SELECT * FROM members WHERE user_id = ${member.id} AND guild_id = ${message.guild.id}`)).rows[0];

        if(!data) return message.reply('No data.');

        let [messages, voice, afk, muted, mutePercent] = [data.messages, data.voice_minutes, data.afk_count, data.mute_minutes];

        mutePercent = voice > 0 ? `\`${Math.round(10000*muted/voice)/100}%\`` : '';
        voice = voice >= 120 ? `\`${Math.round(voice/6)/10}\` hours` : `\`${voice}\` minutes`;
        muted = muted >= 600 ? `\`${Math.round(muted/6)/10}\` hours` : `\`${muted}\` minutes`;

        message.channel.send({ embed: {
            title: `${message.guild.name.toUpperCase()} STATS`,
            description: `**[${this.client.functions.levelCalc(data.xp)}] • ${member}**`,
            fields: [
                {
                    name: 'MESSAGES',
                    value: `\`${this.client.functions.groupDigits(messages)}\``,
                    inline: true,
                },
                {
                    name: 'VOICE',
                    value: voice,
                    inline: true
                },
                this.client.config.presets.blankFieldInline,
                {
                    name: 'AFK COUNT',
                    value:`\`${afk}\``,
                    inline: true
                },
                {
                    name: 'MUTED',
                    value: `${muted}, ${mutePercent}`,
                    inline: true
                },
                this.client.config.presets.blankFieldInline
            ],
            thumbnail: {
                url: member.user.displayAvatarURL()
            }
        }});
    };
};

module.exports = StatsCommand;