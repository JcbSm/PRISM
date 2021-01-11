const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'reactionmessage',
    aliases: ['rmessage'],
    description: {
        usage: ['[add|remove|list] (Message URL)'],
        content: 'Add or remove a reaction message'
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['MANAGE_ROLES', 'ADD_REACTIONS', 'SEND_MESSAGES'],
    userPermissions: ['MANAGE_ROLES', 'MANAGE_MESSAGES'],
}, __dirname)

class ReactionMessageCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(msg) {

        const option = yield {
            type: [
                ['ADD', 'A'],
                ['REMOVE', 'RM', 'R'],
                ['LIST', 'VIEW']
            ],
            prompt: {
                start: message => {
                    this.client.emit('help', message, this)
                },
                retry: message => {
                    this.client.emit('help', message, this)
                }
            }
        };

        const str = yield {
            type: 'string',
            match: 'rest'
        };

        let message = await this.client.functions.resolveMessage(str);
        let id = message ? null : isNaN(Number(str)) ? null : Number(str);
        let url = message ? message.url : null
        const reactionMessage = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE message_url = '${url}' OR reaction_message_id = ${id}`)).rows[0];
        
        let confirm;
        if(option === 'REMOVE' && (message || id) && reactionMessage.guild_id === msg.guild.id) {

            confirm = yield {
                type: [
                    ['YES', 'Y'],
                    ['NO', 'N']
                ],
                match: 'none',
                prompt: {
                    start: { embed: {
                        title: 'CONFIRM',
                        description: 'Are you sure you would like to remove this reaction message **(Y/N)**',
                        color: await this.client.config.colors.embed(msg.guild)
                    }}
                }
            }
        }

        confirm === 'YES' ? confirm = true : confirm === 'NO' ? confirm = false : confirm = undefined;

        return { option, message, reactionMessage, confirm };

    };

    async exec(message, args) {

        if(args.option === 'ADD') {

            if(args.message) {

                try {

                    const id = (await this.client.db.query(`INSERT INTO reaction_messages (message_url, guild_id) VALUES ('${args.message.url}', ${message.guild.id}) RETURNING *`)).rows[0].reaction_message_id;
                    return message.channel.send({ embed: {
                        title: 'REACTION MESSAGE ADDED',
                        description: `✅ Added new [reaction message](${args.message.url}) with \`ID:${id}\``,
                        color: this.client.config.colors.green
                    }});  

                } catch {

                    return message.reply('An Error occurred, this could be due to duplicate reaction messages.')

                }

            } else {

                return message.reply('Invalid message link provided.')

            }

        } else if(args.option === 'REMOVE') {

            if(args.reactionMessage.guild_id !== message.guild.id) return message.reply('Reaction Messages must be in this server.');

            if(args.confirm) {

                await this.client.db.query(`DELETE FROM reaction_messages WHERE reaction_message_id = ${args.reactionMessage.reaction_message_id}`)

                return message.channel.send({ embed: {
                    title: 'REACTION MESSAGE REMOVED',
                    description: `✅ Removed [reaction message](${args.reactionMessage.message_url}).`,
                    color: this.client.config.colors.green
                }});

            } else {

                return message.channel.send({ embed: {
                    title: 'CANCELLED',
                    description: `❌ [Reaction message](${data.message_url}) was not removed.`,
                    color: this.client.config.colors.red
                }});

            }

        } else if(args.option === 'LIST') {

            if(!args.message && !args.reactionMessage) {

                const data = (await this.client.db.query(`SELECT * FROM reaction_messages WHERE guild_id = ${message.guild.id}`)).rows;

                return message.channel.send({ embed: {
                    title: `${message.guild.name.toUpperCase()} REACTION MESSAGES`,
                    description: data.map(d => `\`${d.reaction_message_id}\` • [[MESSAGE]](${d.message_url})`).join('\n'),
                    color: await this.client.config.colors.embed(message.guild)
                }});

            } else if(args.reactionMessage) {

                const reactions = (await this.client.db.query(`SELECT * FROM reactions WHERE reaction_message_id = ${args.reactionMessage.reaction_message_id}`)).rows;
                
                return message.channel.send({ embed: {
                    title: `ROLE REACTIONS`,
                    description: `[Reaction Message](${args.reactionMessage.message_url})\n\n${reactions.map(r => `\`${r.reaction_id}\` • ${this.client.emojis.resolve(r.emoji) ? this.client.emojis.resolve(r.emoji) : r.emoji} • <@&${r.role_id}>`).join('\n')}`,
                    color: await this.client.config.colors.embed(message.guild),
                    timestamp: Date.now()
                }})

            }

        } else {
            return message.reply('No message found.')
        }
    };
};

module.exports = ReactionMessageCommand;