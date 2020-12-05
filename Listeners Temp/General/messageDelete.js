const { Listener } = require('discord-akairo');

class MessageDeleteListener extends Listener {
    constructor() {
        super('messageDelete', {
            emitter: 'client',
            event: 'messageDelete'
        });
    };

    async exec(message) {
        
        if(!message.author.bot) {
            this.client.emit('log-messageDelete', message)
        };
    };
};

module.exports = MessageDeleteListener;