const { Listener } = require('discord-akairo');

class XpLevelUpListener extends Listener {
    constructor() {
        super('xp-levelUp', {
            emitter: 'client',
            event: 'xp-levelUp'
        });
    };

    async exec(member, xp) {

        const data = (await this.client.db.query(`SELECT levels_channel_id, config FROM guilds WHERE guild_id = ${member.guild.id}`)).rows[0];
        const [channelID, config, level] = [data.levels_channel_id, JSON.parse(data.config), this.client.functions.levelCalc(xp)];

        if(channelID) {

            const channel = await this.client.channels.fetch(channelID)

            const { parseText } = this.client.functions;

            let message;

            if(config.levels.message.type === 'embed') {

                message = ('', {embed: {
                    description: parseText(config.levels.message.text, member)
                }})
            } else if(config.levels.message.type === 'message') {
                
                message = parseText(config.levels.message.text, member)
            };

            channel.send(message);

        };

        if(config.levels.roles.rewards.length > 0) {

            let roles = config.levels.roles.rewards;
            roles = roles.sort((a, b) => a.level-b.level);

            if(config.levels.roles.stack === true) {

                let arr = [];

                for(const role of roles) {

                    if(role.level <= level) arr.push(role.id)
                };

                member.roles.add(arr);

            } else {

                let [removeArr, add] = [[], null];

                for(const role of roles) {

                    if(role.level <= level) {
                        removeArr.push(role.id);
                        add = role.id
                    } else {
                        removeArr.push(role.id)
                    };
                };

                if(removeArr.length > 0) await member.roles.remove(removeArr);
                if(add) await member.roles.add(add)
            }
        };
    };
};

module.exports = XpLevelUpListener;