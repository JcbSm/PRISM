const { Listener } = require('discord-akairo');

class LogMessageUpdateListener extends Listener {
    constructor() {
        super('log-messageUpdate', {
            emitter: 'client',
            event: 'log-messageUpdate'
        });
    };

    async exec(oldMessage, newMessage) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${newMessage.guild.id}`)).rows[0].logs_channel_id;

        if(channelID) {
            const channel = newMessage.guild.channels.cache.get(channelID);
            channel.send({ embed: {
                title: 'MESSAGE UPDATED',
                description: `\`[${this.client.functions.UCT(newMessage.editedTimestamp)} UCT]\` • [\`Jump\`](${newMessage.url})`,
                fields: [
                    {
                        name: 'BEFORE',
                        value: oldMessage.content
                    },
                    {
                        name: 'AFTER',
                        value: newMessage.content
                    },
                    {
                        name: 'MEMBER',
                        value: oldMessage.member,
                        inline: true
                    },
                    {
                        name: 'CHANNEL',
                        value: `${oldMessage.channel}`,
                        inline: true
                    }
                ],
                author: {
                    name: oldMessage.author.tag,
                    icon_url: oldMessage.author.displayAvatarURL()
                },
                timestamp: new Date(),
                color: await this.client.config.colors.embed(newMessage.guild)
            }});
        };
    };
};

module.exports = LogMessageUpdateListener;