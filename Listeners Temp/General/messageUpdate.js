const { Listener } = require('discord-akairo');

class MessageUpdateListener extends Listener { 
    constructor() {
        super('messageUpdate', {
            emitter: 'client',
            event: 'messageUpdate'
        });
    };

    async exec(oldMessage, newMessage) {

        if(oldMessage.content !== newMessage.content && !newMessage.author.bot) {
            this.client.emit('log-messageUpdate', oldMessage, newMessage);
        };
    };
};

module.exports = MessageUpdateListener;