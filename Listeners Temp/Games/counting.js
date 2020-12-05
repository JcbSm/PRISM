const { Listener } = require('discord-akairo');
const { last } = require('lodash');

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
        const messages = (await message.channel.messages.fetch( {limit: 100, before: message.id} ));

        const lastCount = messages.first();
        const [a, b] = [Number(message.content), Number(lastCount.content)];

        if(a !== currentCount+1 || message.author.id === lastCount.author.id || !/^[1-9]\d*$/.test(message.content)) {

            await message.delete();

            if(b !== currentCount) {

                let [i] = [0]
                for(const [id, message] of messages) {
                    if(Number(message.content) !== currentCount) {
                        i++;
                    } else {
                        break;
                    }
                }
                
                if(i === messages.size) message.channel.send(currentCount); else message.channel.bulkDelete(i)

            }

        } else {

            await this.client.db.query(`
                UPDATE guilds SET counting_count = ${a}
                WHERE guild_id = ${message.guild.id};

                UPDATE members SET counting_counts = counting_counts + 1, counting_last_message_url = '${message.url}'
                WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id};`
            );
        };
    };
};

module.exports = CountingListener;