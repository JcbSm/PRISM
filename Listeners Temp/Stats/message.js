const { Listener } = require('discord-akairo');

class StatSMessageListener extends Listener {
    constructor() {
        super('stats-message', {
            emitter: 'client',
            event: 'stats-message'
        });
    };

    async exec(message) {

        await this.client.db.query(`UPDATE members SET messages = messages + 1 WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)
    };
};

module.exports = StatSMessageListener;