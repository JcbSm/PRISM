const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'addrolereaction',
    aliases: ['addreactionrole', 'addrr'],
    description: {
        usage: ['[Reaction Message URL | ID] [emoji] [role]'],
        content: `Add a new role reaction\n\nType \`reactionmessage list\` to view this server Reaction Messages.`
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['ADD_REACTIONS', 'MANAGE_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
}, __dirname)

class RoleReactionCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        let [client] = [this.client]

        const reactionMessage = yield {
            type: async (message, phrase) => {
                
                let [id, url] = [ isNaN(Number(phrase)) ? null : Number(phrase), isNaN(Number(phrase)) ? (await client.functions.resolveMessage(phrase)) ? (await client.functions.resolveMessage(phrase)).url : null : null ]

                return (await client.db.query(`SELECT * FROM reaction_messages WHERE reaction_message_id = ${id} OR message_url = '${url}' AND guild_id = ${message.guild.id}`)).rows[0]
            
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

        const emoji = yield {

            type: async (message, phrase) => {

                function resolveEmoji(str) {
                    var ranges = [
                        '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])' // U+1F680 to U+1F6FF
                    ];
                    if (str.match(ranges.join('|'))) {
                        return str.match(ranges.join('|'))[0];
                    } else if(/(<:.+:\d{18}>)/g.test(str)) {
                        return client.emojis.resolve(str.replace(/\D/g, '')) ? client.emojis.resolve(str.replace(/\D/g, '')).id : undefined;
                    } else {
                        return undefined
                    }
                };

                return resolveEmoji(phrase)

            },
            prompt: {
                start: `${message.author}, please provide a valid emoji.`,
                retry: `${message.author}, Please provide a valid emoji.`
            }
        };

        const role = yield {

            type: 'role',
            match: 'rest',
            prompt: {
                start: `${message.author}, please provide a role.`,
                retry: `${message.author}, Please provide a role.`
            }
        };

        return { reactionMessage, emoji, role }

    };

    async exec(message, { reactionMessage, emoji, role }) {

        await this.client.db.query(`INSERT INTO reactions (reaction_message_id, emoji, role_id) VALUES (${reactionMessage.reaction_message_id}, '${emoji}', ${role.id}) RETURNING *`, async (err, res) => {

            if(res) {

                let msg = await this.client.functions.resolveMessage(reactionMessage.message_url);
                await msg.react(emoji);

                return message.channel.send({ embed: {

                    title: 'ADDED ROLE REACTION',
                    description: `Added Role Reaction to [Reaction Message \`[${reactionMessage.reaction_message_id}]\`](${msg.url}) with \`ID: ${res.rows[0].reaction_id}\``,
                    fields: [
                        {
                            name: 'EMOJI',
                            value: this.client.emojis.resolve(emoji) ? this.client.emojis.resolve(emoji) : emoji,
                            inline: true
                        },
                        {
                            name: 'ROLE',
                            value: `${role}`,
                            inline: true
                        }
                    ],
                    color: await this.client.config.colors.green
                }});

            } else {

                return essage.reply('An error occurred, this could be due to duplicate Emojis.')

            };

        });

    };
};

module.exports = RoleReactionCommand;