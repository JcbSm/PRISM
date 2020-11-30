const { Listener } = require('discord-akairo');

class VoiceStateUpdateListener extends Listener {
    constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    };

    async exec(oldState, newState) {

        if(!(await this.client.db.query(`SELECT user_id FROM members WHERE user_id = ${newState.member.id}`)).rows[0] && !newState.member.user.bot) {
            this.client.emit('addMember', newState.member)
        }

        if(!oldState.channel && newState.channel) {
            //Join VC
            await this.client.db.query(`UPDATE members SET voice = true WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)
            this.client.emit('xp-joinVoice', oldState, newState);
            this.client.emit('stats-joinVoice', oldState, newState);
        } else if(!newState.channel && oldState.channel) {
            //Leave VC
            await this.client.db.query(`UPDATE members SET voice = false WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)
        } else if(oldState.channel && newState.channel && newState.channel.id !== oldState.channel.id) {
            //Switch VC
            await this.client.db.query(`UPDATE members SET voice = true WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)
            this.client.emit('xp-joinVoice', oldState, newState);
            this.client.emit('stats-joinVoice', oldState, newState);
        } else {
            //Other
            if(!(await this.client.db.query(`SELECT voice FROM members WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)).rows[0].voice) {
                this.client.emit('voiceStateUpdate', newState.member, newState);
            };
        };
    };
};

module.exports = VoiceStateUpdateListener;