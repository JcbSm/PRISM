const { Listener } = require('discord-akairo');

class XpAddListener extends Listener {
    constructor() {
        super('xp-add', {
            emitter: 'client',
            event: 'xp-add'
        });
    };

    async exec(member, type) {

        let [xp, multiplier, client] = [0,1, this.client]

        async function checkLevel(xp, member) {
            let current = (await client.db.query(`SELECT xp FROM members WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)).rows[0].xp
            if(client.functions.levelCalc(current+xp) - client.functions.levelCalc(current)) {
                client.emit('xp-levelUp', member, current+xp)
            }
        }

        if(type === 'message') {
            xp = Math.round(this.client.functions.rng(3*multiplier, 7*multiplier));
            checkLevel(xp, member);
            await this.client.db.query(`UPDATE members SET xp = xp + ${xp} WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)
        } else if(type === 'voice') {
            xp = Math.round(5*multiplier);
            checkLevel(xp, member);
            await this.client.db.query(`UPDATE members SET xp = xp + ${xp} WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)
        }
    };
};

module.exports = XpAddListener;