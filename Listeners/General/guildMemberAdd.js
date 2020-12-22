const { Listener } = require('discord-akairo');

class GuildMemberAddListener extends Listener {
    constructor() {
        super('guildMemberAdd', {
            emitter: 'client',
            event: 'guildMemberAdd'
        });
    };

    async exec(member) {

        this.client.emit('log-guildMemberAdd', member)

        //Member Roles
        const data = (await this.client.db.query(`SELECT xp FROM members WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)).rows[0];
        const config = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${member.guild.id}`)).rows[0].config);
        
        if(config) {
            if(config.roles.join.length > 0) {
                await member.roles.add(config.roles.join);
            };
        };

        if(data) {
            this.client.emit('xp-levelUp', member, data.xp, false);
        } else {
            this.client.emit('addMember', member.id, member.guild.id)
        };        
    };
};

module.exports = GuildMemberAddListener;