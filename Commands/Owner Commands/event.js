const { Command } = require('discord-akairo');

class EventCommand extends Command {
    constructor() {
        super('event', {
            aliases: ['event', 'emit'],
            clientPermissions: [],
            args: [
                {
                    id: 'event',
                },
                {
                    id: 'args',
                    match: 'rest'
                }
            ]
        });
    };

    async exec(message, args) {

        let [member] = []

        switch(args.event.toLowerCase()) {
            case 'guildmemberadd':
                this.client.emit('guildMemberAdd', this.client.util.resolveMember(args.args, message.guild.members.cache))
                break;

            case 'guildmemberremove':
                this.client.emit('guildMemberRemove', this.client.util.resolveMember(args.args, message.guild.members.cache))
                break;

            case 'levelup':
                member = this.client.util.resolveMember(args.args, message.guild.members.cache);
                this.client.emit('xp-levelUp', member, (await this.client.db.query(`SELECT xp FROM members WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)).rows[0].xp, true)
                break;
            
        };
        
    };
};

module.exports = EventCommand;