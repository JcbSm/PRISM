const { Listener } = require('discord-akairo');

class RoleReactionAddListener extends Listener {
    constructor() {
        super('roleReaction-add', {
            emitter: 'client',
            event: 'roleReaction-add'
        });
    };

    async exec(roleID, member) {

        await member.roles.add(roleID);

    };
}

module.exports = RoleReactionAddListener;