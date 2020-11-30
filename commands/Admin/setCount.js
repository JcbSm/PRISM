const { Command } = require('discord-akairo');

class SetCoundCommand extends Command {
    constructor() {
        super('setCount', {
            aliases: ['setCount'],
            args: [
                {
                    id: 'count',
                    type: 'number'
                }
            ],
            userPermissions: ['ADMINISTRATOR']
        });
    };

    async exec(message, args) {

        let client = this.client;

        if(args.count < 0 || !args.count) return message.reply('Invalid argument.')

        client.db.query(`SELECT counting_count, counting_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`, (err, res) => {
            if(err) return;
            if(args.count > res.rows[0].counting_count) return message.reply('You can\'t set count to a higher value than it is.');

            let channel = message.guild.channels.cache.get(res.rows[0].counting_channel_id)
            client.db.query(`UPDATE guilds SET counting_count = ${args.count} WHERE guild_id = ${message.guild.id}`, (err, res) => {
                if(err) return;
                channel.send(args.count)
            });
        });
    };
};

module.exports = SetCoundCommand;