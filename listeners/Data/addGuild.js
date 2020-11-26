const { Listener } = require('discord-akairo');

class AddGuildListener extends Listener {
    constructor() {
        super('AddGuild', {
            emitter: 'client',
            event: 'guildCreate'
        });
    };

    async exec(guild) {

        await this.client.db.query(`INSERT INTO guilds (guild_id) VALUES (${guild.id})`, (err, res) => {
            if(res) return console.log(`Added ${guild.name} to table guilds with guild_id ${guild.id}`)
            if(err) return console.log(`Rejoined ${guild.name}.`)
        })
    };
};

module.exports = AddGuildListener