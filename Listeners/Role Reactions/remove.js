const { Listener } = require('discord-akairo');

class RoleReactionRemoveListener extends Listener {
    constructor() {
        super('roleReaction-remove', {
            emitter: 'client',
            event: 'roleReaction-remove'
        });
    };

    async exec(roleID, member) {

        await member.roles.remove(roleID);

    };
}

module.exports = RoleReactionRemoveListener;