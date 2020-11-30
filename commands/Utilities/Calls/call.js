const { Command } = require('discord-akairo');

class CallCommand extends Command {
    constructor() {
        super('call', {
            aliases: ['call', 'pcall'],
            channel: 'guild',
            description: {

            },
            args: [
                {
                    id: 'size',
                    type: 'number',
                    default: 0,
                },
                {
                    id: 'name',
                    match: 'rest'
                }
            ]
        });
    };

    async exec(message, args) {

        const parentID = (await this.client.db.query(`SELECT calls_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].calls_channel_id

        if(parentID) {

            let name = args.name ? args.name : `${message.member.displayName}'s Channel`

            if(name.length > 100) return message.reply('`name` cannot be < 100 characters.')

            try{

                const voiceChannel = await message.guild.channels.create(name, {
                    type: 'voice',
                    userLimit: args.size,
                    parent: parentID,
                    permissionOverwrites: [
                        {
                            id: message.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL']
                        },
                        {
                            id: message.author.id,
                            allow: ['VIEW_CHANNEL'],
                        },
                        {
                            id: this.client.user.id,
                            allow: ['VIEW_CHANNEL']
                        }
                    ]
                });

                if(message.util.parsed.alias === 'call') await voiceChannel.createOverwrite(message.guild.roles.everyone.id, { VIEW_CHANNEL: true});

                const textChannel = await message.guild.channels.create(name, {
                    type: 'text',
                    parent: parentID,
                    permissionOverwrites: [
                        {
                            id: message.guild.roles.everyone.id,
                            deny: ['VIEW_CHANNEL']
                        },
                        {
                            id: message.author.id,
                            allow: ['VIEW_CHANNEL'],
                        },
                        {
                            id: this.client.user.id,
                            allow: ['VIEW_CHANNEL']
                        }
                    ]
                });

                this.client.db.query(`INSERT INTO calls 
                    (guild_id, user_id, voice_channel_id, text_channel_id) 
                    VALUES (${message.guild.id}, ${message.author.id}, ${voiceChannel.id}, ${textChannel.id}
                )`, (err, res) => console.log(err, res));

                await message.react('👌')

            } catch(e) {
                message.reply('An error occurred.')
            }

        } else {
            message.reply('Calls are not enabled in this server.')
        }
    };
};

module.exports = CallCommand;