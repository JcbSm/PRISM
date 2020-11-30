const { Listener } = require('discord-akairo');

class XpMessageListener extends Listener {
    constructor() {
        super('xp-message', {
            emitter: 'client',
            event: 'xp-message'
        });
    };

    async exec(message) {

        const memberData = (await this.client.db.query(`SELECT * FROM members WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)).rows[0];

        const [cooldown] = [60*1000];

        if(Date.now() - memberData.xp_last_message_timestamp > cooldown) {

            await this.client.db.query(`UPDATE members
                SET xp_messages = xp_messages + 1,
                xp_last_message_timestamp = ${message.createdTimestamp}
                WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}
            `);

            this.client.emit('xp-add', message.member, 'message')
        };
    };
};

module.exports = XpMessageListener;