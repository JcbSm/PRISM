const { Listener } = require('discord-akairo');

class LogVoiceStateJoinListener extends Listener {
    constructor() {
        super('log-voiceStateJoin', {
            emitter: 'client',
            event: 'log-voiceStateJoin'
        });
    };

    async exec(state) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${state.guild.id}`)).rows[0].logs_channel_id;

        if(channelID) {
            const channel = state.guild.channels.cache.get(channelID);
            let embed = {
                title: 'MEMBER JOINED CHANNEL',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                author: {
                    name: state.member.user.tag,
                    icon_url: state.member.user.displayAvatarURL()
                },
                timestamp: new Date(),
                color: await this.client.config.colors.green,
                fields: [
                    {
                        name: 'MEMBER',
                        value: `${state.member}`,
                        inline: true
                    },
                    {
                        name: 'CHANNEL',
                        value: `${state.channel}`,
                        inline: true
                    }
                ]
            };

            channel.send({embed: embed})

        };
    };
};

module.exports = LogVoiceStateJoinListener;