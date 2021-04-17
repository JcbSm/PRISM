const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'kick',
    aliases: [],
    channel: 'guild',
    typing: false,
    userPermissions: ['KICK_MEMBERS'],
    clientPermissions: ['KICK_MEMBERS', 'SEND_MESSAGES'],
    description: {
        content: 'Kick a member from the server.', 
        usage: [
            '[member] (reason)',
            '[member]'
        ]
    },
}, __dirname);

class KickCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args() {

        const member = yield {

            type: 'member',
            prompt: {
                start: async message => {
                    this.client.emit('help', message, this)
                },
                retry: async message => {
                    this.client.emit('help', message, this)
                },
            }
        };

        const reason = yield {

            type: 'string',
            match: 'rest'
        }

        let confirm = yield {

            type: [
                ['YES', 'Y'],
                ['NO', 'N']
            ],
            prompt: {
                start: { embed: {
                    title: 'CONFIRM',
                    description: `Are you sure you want to kick ${member}? **(Y/N)**`,
                    fields: [
                        {
                            name: 'REASON',
                            value: `\`${reason}\`` 
                        }
                    ],
                    color: this.client.config.colors.discord.blue
                }}
            },
            match: 'none'
        }

        confirm = confirm === 'YES' ? true : confirm === 'NO' ? false : null

        return { member, reason, confirm }

    }

    async exec(message, args) {

        let reason = `\`${args.reason}\``

        const config = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].config);

        if(args.confirm) {
            
            await args.member.kick(args.reason)
    
            message.channel.send({ embed: {

                title: 'MEMBER REMOVED',
                description: `✅ ${args.member} was kicked.`,
                fields: [
                    {
                        name: 'REASON',
                        value: reason
                    }
                ],
                color: this.client.config.colors.green,
                timestamp: Date.now()
            }});

            args.member.user.send({ embed: {

                title: 'KICK',
                description: await this.client.functions.parseText(config.messages.warnings.kick, args.member),
                fields: [
                    {
                        name: 'REASON',
                        value: reason
                    }
                ],
                color: this.client.config.colors.red,
                timestamp: Date.now()
            }})

        } else {

            message.channel.send({ embed: {

                description: `❌ ${args.member} was not kicked.`,
                color: this.client.config.colors.red,
                timestamp: Date.now()
            }})
        }
    };
};

module.exports = KickCommand;