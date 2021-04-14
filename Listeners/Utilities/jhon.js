const { Listener } = require('discord-akairo');

class JohnListener extends Listener {
    constructor () {
        super('john', {
            emitter: 'client',
            event: 'message'
        });
    };

    exec(message) {

        if(message.channel.id === '831707394995257354' && message.content !== 'prism') return message.delete();
        
    };
}

module.exports = JohnListener;