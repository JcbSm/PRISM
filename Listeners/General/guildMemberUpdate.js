const { Listener } = require('discord-akairo');

class GuildMemberUpdateListener extends Listener {
    constructor() {
        super('guildMemberUpdate', {
            emitter: 'client',
            event: 'guildMemberUpdate'
        });
    };

    async exec(oldMember, newMember) {

        const config = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${newMember.guild.id}`)).rows[0].config)

        if(!this.client.functions.compareArray(oldMember.roles.cache.keyArray(), newMember.roles.cache.keyArray())) {
            //Role Update
            this.client.emit('log-guildMemberRoleUpdate', oldMember, newMember);
            if(config.roles.separators.length !== 0) this.client.emit('util-separator', newMember);
        };

        if(oldMember.nickname !== newMember.nickname) {
            this.client.emit('log-guildMemberNicknameUpdate', oldMember, newMember);
        };
    };
};

module.exports = GuildMemberUpdateListener;