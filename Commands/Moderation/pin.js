const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'pin',
    aliases: [],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[message link]'],
        content: 'Pin a message to the pins channel.'
    },
    clientPermissions: ['SEND_MESSAGES', 'MANAGE_MESSAGES', 'ADD_REACTIONS'],
    userPermissions: ['MANAGE_MESSAGES']
}, __dirname);

class PinCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args() {

        let message = yield {

            type: 'string',
            match: 'rest',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this);
                }
            }
        };

        message = await this.client.functions.resolveMessage(message);

        return { message }
    };

    async exec(message, args) {

        const channelID = (await this.client.db.query(`SELECT pins_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].pins_channel_id;

            if(channelID) {
                if(args.message) {
                    if(args.message.guild.id === message.guild.id) {
                        this.client.emit('util-pin', args.message, await this.client.channels.fetch(channelID))
                    } else {
                        message.reply('Message link must reference a message in this server.')
                    }
                } else {
                    message.reply("Please provide a valid message link.")
                }
            } else {
                message.reply('No active pins channel.')
            }
    };
};

module.exports = PinCommand