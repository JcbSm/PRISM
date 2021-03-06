const { Listener } = require('discord-akairo');
const { NewsChannel } = require('discord.js');

class VoiceStateUpdateListener extends Listener {
    constructor() {
        super('voiceStateUpdate', {
            emitter: 'client',
            event: 'voiceStateUpdate',
        });
    };

    async exec(oldState, newState) {

        //console.log(oldState.channel, newState.channel)
        
        if(!(await this.client.db.query(`SELECT user_id FROM members WHERE user_id = ${newState.member.id}`)).rows[0] && !newState.member.user.bot) {
            this.client.emit('addMember', newState.member)
        }

        const callChannels = (await this.client.db.query(`SELECT call_id, voice_channel_id FROM calls WHERE guild_id = ${oldState.guild.id}`)).rows

        if(!oldState.channel && newState.channel) { // No Channel to a channel

            //Join VC
            await this.client.db.query(`UPDATE members SET voice = true WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)
            
            this.client.emit('xp-joinVoice', oldState, newState);
            this.client.emit('stats-joinVoice', oldState, newState);
            this.client.emit('log-voiceStateJoin', newState);

            if(newState.channel.id === newState.guild.afkChannelID) this.client.db.query(`UPDATE members SET afk_count = afk_count + 1 WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`);

        } else if(!newState.channel && oldState.channel) { // No new channel from a channel

            //Leave VC
            await this.client.db.query(`UPDATE members SET voice = false WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)
            
            this.client.emit('log-voiceStateLeave', oldState);
            
            if(oldState.channel.members.size === 0 && callChannels.map(c => c.voice_channel_id).includes(oldState.channel.id)) {
                this.client.emit('calls-countdown', oldState.channel.id, callChannels.find(c => c.voice_channel_id === oldState.channel.id).call_id)
            }

        } else if(oldState.channel && newState.channel && newState.channel.id !== oldState.channel.id) { // Old and new channel and channels aren't the same

            //Switch VC
            await this.client.db.query(`UPDATE members SET voice = true WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`)
            
            this.client.emit('xp-joinVoice', oldState, newState);
            this.client.emit('stats-joinVoice', oldState, newState);
            this.client.emit('log-voiceStateSwitch', oldState, newState);
            if(newState.channel.id === newState.guild.afkChannelID) this.client.db.query(`UPDATE members SET afk_count = afk_count + 1 WHERE user_id = ${newState.member.id} AND guild_id = ${newState.guild.id}`);
            
            if(oldState.channel.members.size === 0 && callChannels.map(c => c.voice_channel_id).includes(oldState.channel.id)) {
                this.client.emit('calls-countdown', oldState.channel.id, callChannels.find(c => c.voice_channel_id === oldState.channel.id).call_id)
            }

        } else {

            //Other
            
        };
    };
};

module.exports = VoiceStateUpdateListener;