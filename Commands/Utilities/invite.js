const { Command } = require('discord-akairo');
const { Invite } = require('discord.js');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'invite',
    aliases: [],
    description: {
        usage: [''],
        content: 'Invite the bot to a server'
    },
    channel: null,
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: [],
}, __dirname)

class InviteCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

    };

    async exec(message, args) {

        return message.reply({ embed: {
            title: '[ BOT INVITE ]',
            description: '• Join [PRISM](https://discord.gg/DYwbhrVkau)',
            url: 'https://discord.com/api/oauth2/authorize?client_id=781251363958816769&permissions=8&scope=bot',
            color: await this.client.config.colors.embed(message.guild)
        }});

    };
};

module.exports = InviteCommand;