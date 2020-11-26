const { Command } = require('discord-akairo');

class PrefixCommand extends Command {
    constructor() {
        super('prefix', {
            aliases: ['prefix', 'setprefix'],
            description: {
                usage: 'prefix <prefix>',
                content: 'Sets a new prefix for your server'
            },
            category: 'Administration',
            args: [
                {
                    id: 'prefix',
                    match: 'rest'
                }
            ],
            userPermissions: ['ADMINISTRATOR']
        });
    };

    async exec(message, args) {

        await this.client.db.query(`UPDATE guilds SET prefix = '${args.prefix}' WHERE guild_id = ${message.guild.id}`, async (err, res) => {
            if(res) {
                message.channel.send({ embed: {
                    description: `Set the prefix in **${message.guild.name}** to \`${args.prefix}\``
                }});
            } else {
                console.log(err)
                message.reply('Invalid prefix. Max 2 characters.')
            }
        });
    };
};

module.exports = PrefixCommand;