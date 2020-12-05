const { Listener } = require('discord-akairo');

class LogVoiceStateSwitchListener extends Listener {
    constructor() {
        super('log-voiceStateSwitch', {
            emitter: 'client',
            event: 'log-voiceStateSwitch'
        });
    };

    async exec(oldState, newState) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${newState.guild.id}`)).rows[0].logs_channel_id;

        if(channelID) {
            const channel = newState.guild.channels.cache.get(channelID);
            let embed = {
                title: 'MEMBER SWITCH CHANNEL',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                author: {
                    name: newState.member.user.tag,
                    icon_url: newState.member.user.displayAvatarURL()
                },
                timestamp: new Date(),
                color: await this.client.config.colors.embed(newState.guild),
                fields: [
                    {
                        name: 'MEMBER',
                        value: `${newState.member}`,
                    },
                    {
                        name: 'FROM',
                        value: `${oldState.channel}`,
                        inline: true
                    },
                    {
                        name: 'TO',
                        value: `${newState.channel}`,
                        inline: true
                    }
                ]
            };

            channel.send({embed: embed})

        };
    };
};

module.exports = LogVoiceStateSwitchListener;