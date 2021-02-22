const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'userlimit',
    aliases: [],
    description: {
        usage: ['(size)'],
        content: 'Change the user limit on a call. Anything from `1-99`.\nSet to `0` for unlimited'
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['MANAGE_CHANNELS'],
    userPermissions: [],
}, __dirname)

class UserLimitCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const num = yield {
            type: (message, phrase) => {
                let value = Math.floor(Number(phrase));
                if(value < 0 || value > 99) value = undefined;
                return value;
            },
            prompt: this.client.functions.helpPrompt(message, this)
        };

        return { num }

    };

    async exec(message, args) {

        let [client] = [this.client];
        const call = (await client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {

            if(call.user_id !== message.author.id && !message.member.permissions.has('MANAGE_CHANNELS')) return message.reply(`Only the owner can user this command.`);

            const voiceChannel = message.guild.channels.cache.get(call.voice_channel_id);

            await voiceChannel.setUserLimit(args.num)

            return message.channel.send({ embed: {
                title: 'UPDATED USERLIMIT',
                description: `Changed the user limit to \`${args.num}\``,
                color: await this.client.config.colors.embed(message.guild),
                timestamp: Date.now()
            }});
        
        } else {

            return message.reply('No user call found.')

        }

    };
};

module.exports = UserLimitCommand;