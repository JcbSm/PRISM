const { Listener } = require('discord-akairo');

class CallsCountdownListener extends Listener {
    constructor() {
        super('calls-countdown', {
            emitter: 'client',
            event: 'calls-countdown'
        });
    };

    async exec(voiceChannelID, callID) {

        let [n, timeout, client, channel] = [0, 15, this.client, await this.client.channels.fetch(voiceChannelID)];

        const { text_channel_id, persistent } = (await this.client.db.query(`SELECT text_channel_id, persistent FROM calls WHERE call_id = ${callID}`)).rows[0];

        let textChannel = await this.client.channels.fetch(text_channel_id);
        
        if (persistent) return textChannel.send({ embed: {
            description: `Everyone left the call. Persistent calls will not delete automatically, to end the call use the \`-endcall\` command.`,
            color: await client.config.colors.embed(channel.guild)
        }});
        
        let sent = await textChannel.send({ embed: {
            description: `Everyone left the call. If no one rejoins in \`${timeout}\` seconds, the call will be removed.`,
            color: await client.config.colors.embed(channel.guild)
        }});

        let interval = setInterval(async function() {
            n++;

            if(channel.members.size > 0 || (await client.db.query(`SELECT persistent FROM calls WHERE call_id = ${callID}`)).rows[0].persistent) {
                clearInterval(interval);
                sent.delete();

            } else if(n >= timeout && channel.members.size === 0) {

                client.emit('calls-end', callID)
                clearInterval(interval)
            }

        }, 1000)
    };
};

module.exports = CallsCountdownListener;