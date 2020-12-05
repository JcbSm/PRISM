const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'prefix',
    aliases: ['setprefix'],
    description: {
        usage: ['[prefix]'],
        content: 'Set the prefix for this guild'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
}, __dirname)

class PrefixCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args() {

        const prefix = yield {

            type: 'string',
            match: 'rest'
        };

        return { prefix }
    };

    async exec(message, args) {

        if(!args.prefix) {
            message.channel.send({ embed: {
                description: `The prefix in **${message.guild.name}** is \`${(await this.client.db.query(`SELECT prefix FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].prefix}\``,
                color: this.client.config.colors.discord.blue
            }});
        } else {

            await this.client.db.query(`UPDATE guilds SET prefix = '${args.prefix}' WHERE guild_id = ${message.guild.id}`, async (err, res) => {
                if(res) {
                    message.channel.send({ embed: {
                        description: `Set the prefix in **${message.guild.name}** to \`${args.prefix}\``,
                        color: this.client.config.colors.discord.blue
                    }});
                } else {
                    console.log(err)
                    message.reply('Invalid prefix. Max 2 characters.')
                }
            });
        };
    };
};

module.exports = PrefixCommand;