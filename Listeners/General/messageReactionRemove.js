const { Listener } = require('discord-akairo');

class MessageReactionRemoveListener extends Listener {
    constructor() {
        super('messageReactionRemove', {
            emitter: 'client',
            event: 'messageReactionRemove'
        });
    };

    async exec(reaction, user) {

        if(reaction.partial) reaction = await reaction.fetch();

        const reactionMessage = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE message_url = '${reaction.message.url}'`)).rows[0];

        if(reactionMessage) {

            if(user.id === this.client.user.id) return reaction.message.react(reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name)

            const reactions = (await this.client.db.query(`SELECT * FROM reactions WHERE reaction_message_id = ${reactionMessage.reaction_message_id}`)).rows;

            let emojiStr = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;

            if(reactions.map(r => r.emoji).includes(emojiStr)) {

                this.client.emit('roleReaction-remove', reactions.find(r => r.emoji === emojiStr).role_id, await reaction.message.guild.members.fetch(user.id));

            };

        };

    };
};

module.exports = MessageReactionRemoveListener;