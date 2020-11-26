const { Listener } = require('discord-akairo');

class ReadyListener extends Listener {
    constructor() {
        super('ready', {
            event: 'ready',
            emitter: 'client'
        });
    };

    async exec() {
        console.log('Online')
    };
};

module.exports = ReadyListener;