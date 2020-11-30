const { Listener } = require('discord-akairo');

class CountingListener extends Listener {
    constructor() {
        super('counting', {
            emitter: 'client',
            event: 'count'
        });
    };

    async exec(message) {

        if(message.author.bot) return;

        const currentCount = (await this.client.db.query(`SELECT counting_count FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].counting_count

        //Get previous message
        const lastCount = (await message.channel.messages.fetch( {limit: 1, before: message.id} )).first();
        const [a, b] = [Number(message.content), Number(lastCount.content)];

        if(b !== currentCount) {
            await message.channel.send(currentCount);
            message.delete();
        } else {

            //Check message
            let valid = (/^[1-9]\d*$/.test(message.content) && message.author.id !== lastCount.author.id)
            valid = (a === currentCount + 1)
            if(!valid) return message.delete();

            //Data
            this.client.db.query(`UPDATE guilds SET counting_count = ${a} WHERE guild_id = ${message.guild.id}`)
        }
    };
};

module.exports = CountingListener;