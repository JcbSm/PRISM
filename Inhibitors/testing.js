const { Inhibitor } = require('discord-akairo');

class TestingInhibitor extends Inhibitor {
    constructor() {
        super('testing', {
            reason: 'testing'
        });
    };

    exec(message) {

        return (this.client.testing && message.guild.id !== '569556194612740115');
    };
};

module.exports = TestingInhibitor;