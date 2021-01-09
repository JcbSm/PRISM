const { Listener } = require('discord-akairo');

class LogMissingPermissionsListener extends Listener {
    constructor() {
        super('log-missingPermissions', {
            emitter: 'client',
            event: 'log-missingPermissions',
        });
    };

    async exec(message, command, missing) {

        const channelID = (await this.client.db.query(`SELECT logs_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].logs_channel_id;
        
        if(channelID) {

            const channel = message.guild.channels.cache.get(channelID);

            channel.send({ embed: {

                title: 'MISSING PERMISSIONS',
                description: `\`[${this.client.functions.UCT()} UCT]\``,
                fields: [
                    {
                        name: 'MEMBER',
                        value: `${message.member}`,
                        inline: true
                    },
                    {
                        name: 'COMMAND',
                        value: command.id,
                        inline: true
                    },
                    {
                        name: 'PERMISSIONS',
                        value: missing.map(m => `\`${m}\``).join('\n')
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

module.exports = LogMissingPermissionsListener;