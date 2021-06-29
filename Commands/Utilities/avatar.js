const { Command } = require('discord-akairo');
const { MessageAttachment } = require('discord.js');
const Discord = require('discord.js');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'avatar',
    aliases: [],
    channel: null,
    typing: true,
    description: {
        usage: ['(user)'],
        content: 'Get a users avatar.'
    },
    userPermissions: ['SEND_MESSAGES'],
    clientPermissions: []
}, __dirname);

class AvatarCommand extends Command { 
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {
        const member = yield {
            type: 'member',
            default: message => message.member
        };

        const user = member.user

        return { user };
    };

    async exec(message, { user }) {

        return message.channel.send({ embed: {
            footer: {
                text: user.tag
            },
            timestamp: Date.now(),
            image: {
                url: user.displayAvatarURL({ size: 4096, format: 'png' })
            },
            color: await this.client.config.colors.embed(message.guild),
        }})
    }
}

module.exports = AvatarCommand;