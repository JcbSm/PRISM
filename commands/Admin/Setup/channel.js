const { Command } = require('discord-akairo');

class ChannelCommand extends Command {
    constructor() {
        super('channel', {
            aliases: ['channel', 'setchannel'],
            description: {
                usage: 'channel <option> <channel>',
                content: 'Sets specified channel to be used'
            },
            category: 'Administration',
            args: [
                {
                    id: 'option'
                },
                {
                    id: 'channel',
                    type: 'channel',
                    match: 'rest'
                }
            ]
        });
    };

    async exec(message, args) {

        const val = args.channel ? args.channel.id : null

        switch(args.option.toLowerCase()) {

            case 'log':
            case 'logs':
                await this.client.db.query(`UPDATE guilds SET log_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            case 'counting':
                await this.client.db.query(`UPDATE guilds SET counting_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            case 'wording':
                await this.client.db.query(`UPDATE guilds SET wording_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            case 'calls':
                await this.client.db.query(`UPDATE guilds SET custom_calls_parent_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            default:
                return message.reply('Unknown option, please pick either \'log\', \'calls\', \'counting\' or \'wording\'')
        };

        message.channel.send({ embed: {
            description: `Set ${args.option} channel to ${args.channel}`
        }})
    };
};

module.exports = ChannelCommand;