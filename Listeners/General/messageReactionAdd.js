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

        //RoleReaction
        const reactionMessage = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE message_url = '${reaction.message.url}'`)).rows[0];

        if(reactionMessage) {

            if(user.bot) return;

            const reactions = (await this.client.db.query(`SELECT * FROM reactions WHERE reaction_message_id = ${reactionMessage.reaction_message_id}`)).rows;

            let emojiStr = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;

            if(reactions.map(r => r.emoji).includes(emojiStr)) {

                this.client.emit('roleReaction-add', reactions.find(r => r.emoji === emojiStr).role_id, await reaction.message.guild.members.fetch(user.id));

            };

        };

        //Pin Reaction
        if(reaction.emoji.name === '📌') {

            if(reaction.message.author.id === user.id) {

                reaction.remove();
        
            } else {

                const { pins_channel_id, pins_reactions } = (await this.client.db.query(`SELECT pins_channel_id, pins_reactions FROM guilds WHERE guild_id = ${reaction.message.guild.id}`)).rows[0];
                const pinChannel = await this.client.channels.fetch(pins_channel_id);

                if (pinChannel && pins_reactions > 0) {
                    
                    if(reaction.count === pins_reactions && !reaction.users.cache.keyArray().includes(this.client.user.id)) {
                        
                        this.client.emit('util-pin', reaction.message, pinChannel)
                        await reaction.message.react('📌')
                        
                    }

                }        
            }
        }
    };
};

module.exports = MessageReactionAddListener;