const { Listener } = require('discord-akairo');

class GuildMemberRemoveListener extends Listener {
    constructor() {
        super('GuildMemberRemove', {
            emitter: 'client',
            event: 'guildMemberRemove'
        });
    };

    async exec(member) {

        this.client.emit('log-guildMemberRemove', member);
    };
};

module.exports = GuildMemberRemoveListener;