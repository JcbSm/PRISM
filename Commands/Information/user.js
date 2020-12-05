const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');
const moment = require('moment');

const commandInfo = commandOptions({
    id: 'user',
    aliases: ['userinfo'],
    channel: null,
    typing: false,
    description: {
        usage: ['(user)'],
        content: 'View user info.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class UserInfoCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const user = yield {

            type: 'user',
            default: message => message.author
        };

        return { user }
    };

    async exec(message, args) {

        const user = args.user;
        console.log(user.presence.activities)

        let embed = {
            title: 'USER INFO',
            description: `${user} - ${this.client.functions.since(user.createdTimestamp, 3)} old.`,
            thumbnail: {
                url: user.displayAvatarURL()
            },
            fields: [
                {
                    name: 'USERNAME',
                    value: user.username,
                    inline: true
                },
                {
                    name: 'DISCRIMINATOR',
                    value: `\`${user.discriminator}\``,
                    inline: true
                },
                {
                    name: 'ID',
                    value: `\`${user.id}\``,
                    inline: true
                },
                {
                    name: 'STATUS',
                    value: user.presence.status,
                    inline: true
                },
                {
                    name: 'ACTIVITY',
                    value: user.presence.activities[0].type === 'CUSTOM_STATUS' ? user.presence.activities[0].state : user.presence.activities[0].name,
                    inline: true
                },
                {
                    name: 'BOT',
                    value: `\`${user.bot}\``,
                    inline: true
                },
                {
                    name: 'REGISTERED',
                    value: `\`${new moment(user.creadtedAt).format('DD MMM YYYY')}\``,
                    inline: true
                }
            ],
            color: message.guild ? await this.client.config.colors.embed(message.guild) : null
        };

        message.channel.send({ embed: embed });
    };
};

module.exports = UserInfoCommand;