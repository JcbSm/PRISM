const { Listener } = require('discord-akairo');

class ReadyListener extends Listener {
    constructor() {
        super('ready', {
            event: 'ready',
            emitter: 'client'
        });
    };

    async exec() {
        
        this.client.testing ? console.log('Online') : (await this.client.users.fetch(this.client.ownerID)).send({ embed: {
            color: await this.client.config.colors.green,
            title: 'ONLINE',
            description: `\`[${this.client.functions.UCT()} UCT]\``,
            timestamp: Date.now()
        }});
        
        //Resetting things.

        //Voice Tracking
        const voiceMembers = (await this.client.db.query(`SELECT guild_id, user_id FROM members WHERE voice = true`)).rows;

        for(let i = 0; i < voiceMembers.length; i++) {
            if(this.client.testing && voiceMembers[i].guild_id !== '569556194612740115') continue;
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
            try {
                let member = await (await this.client.guilds.fetch(tempMute.guild_id)).members.fetch(tempMute.user_id)
                this.client.emit('mod-tempmute', member)
            } catch {
                console.log(`Missing access to tempmute for user ${tempMute.user_id} in guild ${tempMute.guild_id}`)
            }
        };

        // await this.client.db.query(`DELETE FROM members WHERE guild_id = 569556194612740115`)

        // const mem = await (await this.client.guilds.fetch('569556194612740115')).members.fetch('227848397447626752');

        // this.client.emit('guildMemberAdd', mem)
    };
};

module.exports = ReadyListener;