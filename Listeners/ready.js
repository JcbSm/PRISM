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
        
        //Resetting things.

        //Voice Tracking
        const voiceMembers = (await this.client.db.query(`SELECT guild_id, user_id FROM members WHERE voice = true`)).rows;

        for(let i = 0; i < voiceMembers.length; i++) {
            let member = await (await this.client.guilds.fetch(voiceMembers[i].guild_id)).members.fetch(voiceMembers[i].user_id);
            if(member.voice.channel) {
                this.client.emit('xp-joinVoice', null, member.voice)
                this.client.emit('stats-joinVoice', null, member.voice)
            } else {
                this.client.db.query(`UPDATE members SET voice = false WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)
            };
        };

        //TempMutes
        const tempMutes = (await this.client.db.query(`SELECT user_id, guild_id FROM members WHERE temp_mute IS NOT NULL`)).rows;

        for(const tempMute of tempMutes) {
            let member = await (await this.client.guilds.fetch(tempMute.guild_id)).members.fetch(tempMute.user_id)
            this.client.emit('mod-tempmute', member)
        }

        //console.log(this.client.config.client)
    };
};

module.exports = ReadyListener;