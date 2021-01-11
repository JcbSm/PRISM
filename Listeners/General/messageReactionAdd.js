const { Listener } = require('discord-akairo');

class MessageReactionAddListener extends Listener {
    constructor() {
        super('messageReactionAdd', {
            emitter: 'client',
            event: 'messageReactionAdd'
        });
    };

    async exec(reaction, user) {

        if(reaction.partial) reaction = await reaction.fetch();

        const reactionMessage = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE message_url = '${reaction.message.url}'`)).rows[0];

        if(reactionMessage) {

            if(user.bot) return;

            const reactions = (await this.client.db.query(`SELECT * FROM reactions WHERE reaction_message_id = ${reactionMessage.reaction_message_id}`)).rows;

            let emojiStr = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;

            if(reactions.map(r => r.emoji).includes(emojiStr)) {

                this.client.emit('roleReaction-add', reactions.find(r => r.emoji === emojiStr).role_id, await reaction.message.guild.members.fetch(user.id));

            };

        };

    };
};

module.exports = MessageReactionAddListener;