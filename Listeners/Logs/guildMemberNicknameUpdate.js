const { Listener } = require('discord-akairo');

class LogGuildMemberNicknameUpdateListener extends Listener {
    constructor() {
        super('log-guildMemberNicknameUpdate', {
            emitter: 'client',
            event: 'log-guildMemberNicknameUpdate'
        });
    };

    async exec(oldMember, newMember) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${newMember.guild.id}`)).rows[0].logs_channel_id;
        
        if(channelID) {

            const channel = newMember.guild.channels.cache.get(channelID);
            channel.send({ embed: {
                title: 'MEMBER NICKNAME UPDATED',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                fields: [
                    {
                        name: 'MEMBER',
                        value: `${newMember}`
                    },
                    {
                        name: 'BEFORE',
                        value: oldMember.nickname ? oldMember.nickname : '`null`',
                        inline: true
                    },
                    {
                        name: 'AFTER',
                        value: newMember.nickname ? newMember.nickname : '`null`',
                        inline: true
                    }
                ],
                author: {
                    name: newMember.user.tag,
                    icon_url: newMember.user.displayAvatarURL()
                },
                timestamp: new Date(),
                color: await this.client.config.colors.embed(newMember.guild)
            }})
        }
    };
};

module.exports = LogGuildMemberNicknameUpdateListener;