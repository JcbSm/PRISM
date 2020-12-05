const { Inhibitor } = require('discord-akairo');

class TestingInhibitor extends Inhibitor {
    constructor() {
        super('testing', {
            reason: 'testing'
        });
    };

    exec(message) {

        return (message.guild.id === '569556194612740115');
    };
};

module.exports = TestingInhibitor;