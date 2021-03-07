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

        const [user, userData] = [args.user, (await this.client.db.query(`SELECT user_id, SUM(xp) AS total_xp, SUM(messages) AS total_messages, SUM(voice_minutes) AS total_voice_minutes FROM members WHERE user_id = ${args.user.id} GROUP BY user_id`)).rows[0]];

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
                },/*
                {
                    name: 'ACTIVITY',
                    value: user.presence.activities[0] ? user.presence.activities[0].type === 'CUSTOM_STATUS' ? user.presence.activities[0].state : user.presence.activities[0].name : '`null`',
                    inline: true
                },*/
                {
                    name: 'BOT',
                    value: `\`${user.bot}\``,
                    inline: true
                },
                {
                    name: 'REGISTERED',
                    value: `\`${new moment(user.createdTimestamp).format('DD MMM YYYY')}\``,
                    inline: true
                }
            ],
            color: message.guild ? await this.client.config.colors.embed(message.guild) : null,
            timestamp: Date.now()
        };

        if(userData) {
            embed.fields.push([
                {
                    name: 'TOTAL XP',
                    value: `\`${this.client.functions.groupDigits(userData.total_xp)}\` Lvl: \`${this.client.functions.groupDigits(this.client.functions.levelCalc(userData.total_xp))}\``,
                    inline: true
                },
                {
                    name: 'TOTAL MESSAGES',
                    value: `\`${this.client.functions.groupDigits(userData.total_messages)}\``,
                    inline: true
                },
                {
                    name: 'TOTAL VOICE',
                    value: userData.total_voice_minutes >= 60*1000 ? `\`${this.client.functions.groupDigits(Math.round(userData.total_voice_minutes/60))}\` hours` : userData.total_voice_minutes >= 120 ? `\`${Math.round(userData.total_voice_minutes/6)/10}\` hours` : `\`${userData.total_voice_minutes}\` minutes`,
                    inline: true
                }
            ])
        }

        message.channel.send({ embed: embed });
    };
};

module.exports = UserInfoCommand;