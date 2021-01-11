const { Listener } = require('discord-akairo');

class MessageReactionRemoveAllListener extends Listener {
    constructor() {
        super('messageReactionRemoveAll', {
            emitter: 'client',
            event: 'messageReactionRemoveAll'
        });
    };

    async exec(message) {

        if(message.partial) message = await message.fetch();

        const reactionMessage = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE message_url = '${message.url}'`)).rows[0];

        if(reactionMessage) {

            const reactions = (await this.client.db.query(`SELECT * FROM reactions WHERE reaction_message_id = ${reactionMessage.reaction_message_id}`)).rows;

            for(const r of reactions) {

                await message.react(r.emoji)

            }

        };

    };
};

module.exports = MessageReactionRemoveAllListener;