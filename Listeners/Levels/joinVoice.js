const { Listener } = require('discord-akairo');

class XpJoinVoiceListener extends Listener {
    constructor() {
        super('xp-joinVoice', {
            emitter: 'client',
            event: 'xp-joinVoice'
        });
    };

    async exec(oldState, newState) {

        if(newState.member.user.bot) return;

        let [member, channel, guild, client, afkID, timeout] = [newState.member, newState.channel, newState.guild, this.client, newState.guild.afkChannelID, 300*1000];
        if(channel.id === afkID) return;

        await client.db.query(`UPDATE members SET voice = true WHERE user_id = ${member.id} AND guild_id = ${guild.id}`);

        let interval = setInterval(async function() { 
            if(channel.members.keyArray().includes(member.id)) {
                if(channel.members.filter(m => !m.user.bot).size > 0 && !newState.selfDeaf) {
                    await client.db.query(`UPDATE members SET xp_minutes = xp_minutes + ${timeout/3600} WHERE user_id = ${member.id} AND guild_id = ${guild.id}`);
                    client.emit('xp-add', member, 'voice');
                } else {
                    // Alone or Deafened
                }
            }
            else {
                clearInterval(interval);
            }
        }, timeout);
    };
};

module.exports = XpJoinVoiceListener;