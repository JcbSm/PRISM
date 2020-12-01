const { Command } = require('discord-akairo');
const { commandOptions } = require('../../config').functions;

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
        if(confirm === 'NO') confirm = false

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