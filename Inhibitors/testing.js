const { Inhibitor } = require('discord-akairo');

class TestingInhibitor extends Inhibitor {
    constructor() {
        super('testing', {
            reason: 'testing'
        });
    };

    exec(message) {

        return (this.client.testing && message.guild.id !== '569556194612740115' && message.author.id !== this.client.ownerID);
    };
};

module.exports = TestingInhibitor;