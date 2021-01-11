const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'removerolereaction',
    aliases: ['removereactionrole', 'removerr'],
    description: {
        usage: ['[ID]'],
        content: `Remove a role reaction from a Reaction Message\n\nYou can view role reactions byrunning the command:\n\`reactionmessage view [Reaction Message]\``
    },
    channel: null,
    typing: false,
    clientPermissions: ['MANAGE_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
}, __dirname)

class RemoveRoleReactionCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        let [client] = [this.client]

        const reaction = yield {
            type: async (message, phrase) => {
                
                try {
                    const reaction = (await this.client.db.query(`SELECT * FROM reactions WHERE reaction_id = ${phrase}`)).rows[0];
                    if(reaction) {
                        const reactionMessage = (await this.client.db.query(`SELECT guild_id FROM reaction_messages WHERE reaction_message_id = ${reaction.reaction_message_id}`)).rows[0]
                        
                        if(reactionMessage.guild_id !== message.guild.id) return;

                        return reaction;
                    } else {
                        return;
                    }
                } catch {
                    return undefined;
                }

            },
            prompt: {
                start: message => {
                    this.client.emit('help', message, this)
                },
                retry: message => {
                    this.client.emit('help', message, this)
                }
            }
        };

        return { reaction }

    };

    async exec(message, args) {

        await this.client.db.query(`DELETE FROM reactions WHERE reaction_id = ${args.reaction.reaction_id}`);

        const reactionMessage = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE reaction_message_id = ${args.reaction.reaction_message_id}`)).rows[0];

        return message.channel.send({ embed: {
            title: 'REMOVED ROLE REACTION',
            description: `Removed Role Reaction from [Reaction Message]\`](${reactionMessage.message_url})`,
                    fields: [
                        {
                            name: 'EMOJI',
                            value: this.client.emojis.resolve(args.reaction.emoji) ? this.client.emojis.resolve(args.reaction.emoji) : args.reaction.emoji,
                            inline: true
                        },
                        {
                            name: 'ROLE',
                            value: `<@&${args.reaction.role_id}>`,
                            inline: true
                        }
                    ],
                    color: await this.client.config.colors.red
        }});

    };
};

module.exports = RemoveRoleReactionCommand;