const { Listener } = require('discord-akairo');

class SeparatorListener extends Listener {
    constructor() {
        super('util-separator', {
            emitter: 'client',
            event: 'util-separator'
        });
    }

    async exec(member) {

        const separatorIDs = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${member.guild.id}`)).rows[0].config).roles.separators;
        const separators = separatorIDs.map(r => member.guild.roles.cache.get(r)).sort((a, b) => a.rawPosition - b.rawPosition);

        let [ add, remove ] = [[], []];

        let [roleIndex, separatorIndex] = [ 
            member.roles.cache.filter(r => r.id !== member.guild.roles.everyone.id).map(r => r.rawPosition),
            separators.map(r => r.rawPosition)
        ];

        separatorIndex.unshift(0);

        for(let i = 1; i < separatorIndex.length; i++) {    

            if(roleIndex.some(r => (r < separatorIndex[i]) && r > separatorIndex[i-1])) {
                if(!member.roles.cache.has(separators[i-1].id)) add.push(separators[i-1].id)
            } else {
                if(member.roles.cache.has(separators[i-1].id)) remove.push(separators[i-1].id)
            }
        }

        if(add.length !== 0) member.roles.add(add);
        if(remove.length !== 0) member.roles.remove(remove);
        
    };
};

module.exports = SeparatorListener;