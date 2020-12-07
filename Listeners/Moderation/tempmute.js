const { Listener } = require('discord-akairo');

class TempMuteListener extends Listener {
    constructor() {
        super('mod-tempmute', {
            emitter: 'client',
            event: 'mod-tempmute'
        });
    };

    async exec(member) {

        console.log(`Starting tempmute count for ${member.user.tag} in ${member.guild.name}`)

        let client = this.client

        let interval = setInterval(async function() {
        
            const { temp_mute, mute_role_id } = (await client.db.query(`SELECT temp_mute, mute_role_id FROM members JOIN guilds ON (guilds.guild_id = members.guild_id) WHERE user_id = ${member.id} AND members.guild_id = ${member.guild.id}`)).rows[0];

            if(temp_mute < Date.now()) {
                await client.db.query(`UPDATE members SET temp_mute = null WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)
                member.roles.remove(mute_role_id)
                member.user.send({ embed: {
                    title: 'ALERT',
                    description: `You've been unmuted in **${member.guild.name}**.`,
                    timestamp: Date.now(),
                    color: client.config.colors.green
                }});
                clearInterval(interval)
            } else {
                if(!member.roles.cache.has(mute_role_id)) {
                    member.roles.add(mute_role_id)
                    console.log('Remuted ' + member.user.tag)
                };
            }

        }, 20000);
    };
};

module.exports = TempMuteListener;