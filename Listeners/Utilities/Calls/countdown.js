const { Listener } = require('discord-akairo');

class CallsCountdownListener extends Listener {
    constructor() {
        super('calls-countdown', {
            emitter: 'client',
            event: 'calls-countdown'
        });
    };

    async exec(voiceChannelID, callID) {

        console.log('Starting Call timeout');
        let [n, client, channel] = [0, this.client, await this.client.channels.fetch(voiceChannelID)];
        let interval = setInterval(async function() {
            n++;

            if(channel.members.size > 0) {
                clearInterval(interval);
                console.log('Cancelled')

            } else if(n >= 30 && channel.members.size === 0) {

                client.emit('calls-end', callID)
                clearInterval(interval)
            }

        }, 1000)
    };
};

module.exports = CallsCountdownListener;