const { Listener } = require('discord-akairo');

class AddGuildListener extends Listener {
    constructor() {
        super('AddGuild', {
            emitter: 'client',
            event: 'guildCreate'
        });
    };

    async exec(guild) {

        let client = this.client

        await client.db.query(`INSERT INTO guilds (guild_id) VALUES (${guild.id})`, async (err, res) => {
            if(res) console.log(`Added ${guild.name} to table guilds with guild_id ${guild.id}`)
            if(err) console.log(`Rejoined ${guild.name}.`);

            for(const [id, channel] of guild.channels.cache.filter(c => c.type === 'voice')) {
                if(channel.type === 'voice') {
                    for(const [id, member] of channel.members) {
                        client.emit('voiceStateUpdate', member, member.voice)
                    };
                };
            };
        });
    };
};

module.exports = AddGuildListener