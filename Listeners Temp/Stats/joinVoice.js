const { Listener } = require('discord-akairo');
const StatSMessageListener = require('./message');

class StatsJoinVoiceListener extends Listener {
    constructor() {
        super('stats-joinVoice', {
            emitter: 'client',
            event: 'stats-joinVoice'
        });
    };

    async exec(oldState, newState) {

        let [member, channel, guild, client, timeout] = [newState.member, newState.channel, newState.guild, this.client, 60000];


        await client.db.query(`UPDATE members SET voice = true WHERE user_id = ${member.id} AND guild_id = ${guild.id}`);

        let interval = setInterval(async function() { 

            if(channel.members.keyArray().includes(member.id)) {

                if(member.voice.mute) {
                    
                    //Muted
                    await client.db.query(`UPDATE members SET voice_minutes = voice_minutes + 1, mute_minutes = mute_minutes + 1 WHERE user_id = ${member.id} AND guild_id = ${guild.id}`)
                } else {

                    //Unmute
                    await client.db.query(`UPDATE members SET voice_minutes = voice_minutes + 1 WHERE user_id = ${member.id} AND guild_id = ${guild.id}`)
                };
            } else {

                clearInterval(interval);
            };
        }, timeout);
    };
};

module.exports = StatsJoinVoiceListener;