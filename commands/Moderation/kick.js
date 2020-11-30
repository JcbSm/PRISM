const { Command } = require('discord-akairo');

class KickCommand extends Command {
    constructor() {
        super('kick', {
            aliases: ['kick'],
            channel: 'guild',
            category: 'moderation',
            typing: true,
            userPermissions: ['KICK_MEMBERS'],
            description: {
                content: 'Kick a member from the server.', 
                usage: [
                    '[member] (reason)',
                    '[member]'
                ],
                argumentOptions: [
                    {
                        id: 'member',
                        options: []
                    },
                    {
                        id: 'reason',
                        options: []
                    }
                ]
            },
        });
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
                    description: `Are you sure you want to kick ${member}? (Y/N)`,
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

        if(confirm === 'YES') confirm = true;
        if(confirm === 'NO') confrim = false

        return { member, reason, confirm }

    }

    async exec(message, args) {

        let reason = `\`${args.reason}\``

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

                title: 'ALERT',
                description: `You have been kicked from **${message.guild.name}**.`,
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