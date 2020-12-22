const { Listener } = require('discord-akairo');

class LogGuildMemberAddListener extends Listener {
    constructor() {
        super('log-guildMemberAdd', {
            emitter: 'client',
            event: 'log-guildMemberAdd'
        });
    };

    async exec(member) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${member.guild.id}`)).rows[0].logs_channel_id;
        
        if(channelID) {

            const channel = member.guild.channels.cache.get(channelID);
            channel.send({ embed: {
                title: 'MEMBER JOINED',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                fields: [
                    {
                        name: 'MEMBER',
                        value: `${member}`
                    }
                ],
                author: {
                    name: member.user.tag,
                    icon_url: member.user.displayAvatarURL()
                },
                timestamp: new Date(),
                color: this.client.config.colors.green
            }});
        }
    };
};

module.exports = LogGuildMemberAddListener;