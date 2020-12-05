const { Listener } = require('discord-akairo');

class LogMessageDeleteListener extends Listener {
    constructor() {
        super('log-messageDelete', {
            emitter: 'client',
            event: 'log-messageDelete'
        });
    };

    async exec(message) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].logs_channel_id;
        
        if(channelID) {

            const channel = message.guild.channels.cache.get(channelID);
            channel.send({ embed: {
                title: 'MESSAGE DELETED',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                fields: [
                    {
                        name: 'MESSAGE',
                        value: message.content
                    },
                    {
                        name: 'Member',
                        value: message.member,
                        inline: true
                    },
                    {
                        name: 'Channel',
                        value: message.channel,
                        inline: true
                    }
                ],
                author: {
                    name: message.author.tag,
                    icon_url: message.author.displayAvatarURL()
                },
                timestamp: new Date(),
                color: this.client.config.colors.red
            }});
        };
    };
};

module.exports = LogMessageDeleteListener;