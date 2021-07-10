const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');
const moment = require('moment')

const commandInfo = commandOptions({
    id: 'server',
    aliases: ['guildinfo', 'serverinfo', 'guild'],
    channel: 'guild',
    typing: true,
    description: {
        usage: [''],
        content: 'View guild info.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class GuildInfoCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async exec(message) {

        const guild = message.guild;
        const { prefix, counting_count } = (await this.client.db.query(`SELECT prefix, counting_count FROM guilds WHERE guild_id = ${guild.id}`)).rows[0];

        const members = await guild.members.fetch();
        const channels = guild.channels.cache;

        let embed = {
            title: guild.name.toUpperCase(),
            description: `Created ${this.client.functions.since(guild.createdTimestamp, 3)} ago.`,
            thumbnail: {
                url: guild.iconURL()
            },
            fields: [
                {
                    name: 'OWNER',
                    value: guild.owner,
                    inline: true
                },
                {
                    name: 'REGION',
                    value: guild.region,
                    inline: true
                },
                this.client.config.presets.blankFieldInline,
                {
                    name: 'MEMBERS',
                    value: guild.memberCount,
                    inline: true
                },
                {
                    name: 'HUMANS',
                    value: members.filter(m => !m.user.bot).size,
                    inline: true
                },
                {
                    name: 'BOTS',
                    value: members.filter(m => m.user.bot).size,
                    inline: true
                },
                {
                    name: 'TEXT CHANNELS',
                    value: channels.filter(c => c.type === 'text').size,
                    inline: true
                },
                {
                    name: 'VOICE CHANNELS',
                    value: channels.filter(c => c.type === 'voice').size,
                    inline: true
                },
                {
                    name: 'CATEGORIES',
                    value: channels.filter(c => c.type === 'category').size,
                    inline: true
                },
                {
                    name: 'CREATED',
                    value: new moment(message.guild.createdAt).format('DD MMM YYYY'),
                    inline: true
                },
                {
                    name: 'PREFIX',
                    value: `\`${prefix}\``,
                    inline: true
                },
                {
                    name: 'ROLES',
                    value: guild.roles.cache.size,
                    inline: true
                }
            ],
            color: await this.client.config.colors.embed(guild)
        };

        return message.channel.send({ embed: embed})
    
    };
};

module.exports = GuildInfoCommand;