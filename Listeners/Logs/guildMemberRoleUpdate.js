const { Listener } = require('discord-akairo'); 

class LogGuildMemberRoleUpdateListener extends Listener {
    constructor() {
        super('log-guildMemberRoleUpdate', {
            emitter: 'client',
            event: 'log-guildMemberRoleUpdate'
        });
    };

    async exec(oldMember, newMember) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${newMember.guild.id}`)).rows[0].logs_channel_id;
        
        if(channelID) {

            let [added, removed] = [ newMember.roles.cache.filter(r => !oldMember.roles.cache.keyArray().includes(r.id)), oldMember.roles.cache.filter(r => !newMember.roles.cache.keyArray().includes(r.id)) ];

            const channel = newMember.guild.channels.cache.get(channelID);
            channel.send({ embed: {
                title: 'MEMBER ROLES UPDATED',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                fields: [
                    {
                        name: 'MEMBER',
                        value: `${newMember}`
                    },
                    {
                        name: 'ADDED',
                        value: added.size > 0 ? added.map(r => `<@&${r.id}>`).join("\n") : '`null`',
                        inline: true
                    },
                    {
                        name: 'REMOVED',
                        value: removed.size > 0 ? removed.map(r => `<@&${r.id}>`).join("\n") : '`null`',
                        inline: true
                    }
                ],
                author: {
                    name: newMember.user.tag,
                    icon_url: newMember.user.displayAvatarURL()
                },
                timestamp: new Date(),
                color: await this.client.config.colors.embed(newMember.guild)
            }});
        };
    };
};

module.exports = LogGuildMemberRoleUpdateListener;