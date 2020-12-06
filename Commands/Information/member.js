const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');
const moment = require('moment')

const commandInfo = commandOptions({
    id: 'member',
    aliases: ['memberinfo', 'profile', 'mem', 'mbr'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['(member)'],
        content: 'View member info.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class MemberInfoCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const member = yield {
            type: 'member',
            default: message => message.member,
        };

        return { member };

    };

    async exec(message, args) {

        const member = args.member;
        
        const [ members, config ] = [ await message.guild.members.fetch(), JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${member.guild.id}`)).rows[0].config) ];

        let highestRole;
        if(config.roles.separators.length !== 0) {
            highestRole = member.roles.cache.filter(r => !config.roles.separators.includes(r.id)).sort((a,b) => b.rawPosition - a.rawPosition).first();
        } else {
            highestRole = member.roles.highest
        }

        let embed = {
            title: `${member.guild.name.toUpperCase()} MEMBER PROFILE`,
            description: `${member} - Member for ${this.client.functions.since(member.joinedTimestamp, 3)}.`,
            thumbnail: {
                url: member.user.displayAvatarURL()
            },
            color: await this.client.config.colors.embed(message.guild),
            fields: [
                {
                    name: 'JOIN RANK',
                    value: `\`${members.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp).keyArray().indexOf(member.id)+1}\``,
                    inline: true
                },
                {
                    name: 'NICKNAME',
                    value: member.nickname,
                    inline: true
                },
                {
                    name: 'TAG',
                    value: `\`${member.user.tag}\``,
                    inline: true
                },
                {
                    name: 'JOINED',
                    value: `\`${new moment(member.joinedAt).format('DD MMM YYYY')}\``,
                    inline: true
                },
                {
                    name: 'BOOSTED',
                    value: member.premiumSinceTimestamp ? `\`${new moment(member.premiumSinceTimestamp).format('DD MMM YYYY')}\`` : '`null`',
                    inline: true
                },
                {
                    name: 'HIGHEST ROLE',
                    value: highestRole,
                    inline: true
                }
            ]
        };

        message.channel.send({ embed: embed });
    };
};

module.exports = MemberInfoCommand;