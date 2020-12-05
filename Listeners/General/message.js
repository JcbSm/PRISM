const { Listener } = require('discord-akairo');

class MessageListener extends Listener {
    constructor() {
        super('message', {
            emitter: 'client',
            event: 'message'

        });
    };

    async exec(message) {

        if(message.channel.type === 'text') {

            if(!(await this.client.db.query(`SELECT guild_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0]) {
                this.client.emit('guildCreate', message.guild)
            };

            if(!(await this.client.db.query(`SELECT user_id FROM members WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)).rows[0] && !message.author.bot) {
                this.client.emit('addMember', message.member)
            } else if(!message.author.bot) {
                this.client.emit('xp-message', message)
                this.client.emit('stats-message', message)
            };
            const guildData = (await this.client.db.query(`SELECT * FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0]
            switch(message.channel.id) {
                case guildData.counting_channel_id:
                    this.client.emit('count', message);
            };
        };
    };
};

module.exports = MessageListener;