const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'unmute',
    aliases: [],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[member]'],
        content: 'Unmutes a muted member'
    },
    clientPermissions: ['MANAGE_ROLES', 'MUTE_MEMBERS'],
    userPermissions: ['MANAGE_ROLES', 'MUTE_MEMBERS']
}, __dirname);

class UnmuteCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args(message) {

        const member = yield {

            type: 'member',
            match: 'rest',
            prompt: {
                start: (message) => {
                    this.client.emit('help', message.member, this);
                },
                retry: (message) => {
                    this.client.emit('help', message.member, this);
                }
            }
        };

        return { member };

    };

    async exec(message, args) {

        const { temp_mute, mute_role_id } = (await this.client.db.query(`SELECT temp_mute, mute_role_id FROM members JOIN guilds ON (guilds.guild_id = members.guild_id) WHERE user_id = ${args.member.id} AND guilds.guild_id = ${args.member.guild.id}`)).rows[0];

        if(temp_mute || args.member.roles.cache.has(mute_role_id)) {
            if(temp_mute) {
                await this.client.db.query(`UPDATE members SET temp_mute = null WHERE user_id = ${args.member.id} AND guild_id = ${args.member.guild.id}`);
                await args.member.roles.remove(mute_role_id);
            } else {
                await args.member.roles.remove(mute_role_id);

                await args.member.user.send({ embed: {
                    title: 'ALERT',
                    description: `You've been unmuted in **${args.member.guild.name}**.`,
                    timestamp: Date.now(),
                    color: this.client.config.colors.green
                }});
            }

            message.channel.send({ embed: {

                title: 'MEMBER UNMUTED',
                description: `✅ ${args.member} has been unmuted.`,
                color: this.client.config.colors.green,
                timestamp: Date.now()
            }});

        } else {
            message.reply('This member is not muted.')
        }
    };
};

module.exports = UnmuteCommand;