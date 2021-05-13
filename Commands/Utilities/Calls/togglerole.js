const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'togglerole',
    aliases: ['toggleview', 'togglevisibility'],
    description: {
        usage: ['(role)'],
        content: 'Toggle the visibility of the voice channel.\nIf no role is given, it will default to `@everyone`'
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['MANAGE_CHANNELS'],
    userPermissions: [],
}, __dirname)

class ToggleRoleCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const role = yield {
            type: 'role',
            default: message => message.guild.roles.everyone
        };

        return { role }

    };

    async exec(message, args) {

        let [client, allow] = [this.client, false];
        const call = (await client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {

            if(call.user_id !== message.author.id && !message.member.permissions.has('MANAGE_CHANNELS')) return message.reply(`Only the owner can user this command.`);

            const voiceChannel = message.guild.channels.cache.get(call.voice_channel_id);
            const perms = voiceChannel.permissionOverwrites.get(args.role.id);

            try {
                
                allow = perms ? perms.allow.serialize().VIEW_CHANNEL ? false : true : true;
                voiceChannel.createOverwrite(args.role, { VIEW_CHANNEL: allow })

            } catch(err) {
                console.log(err)
                return message.reply('An error occurred');

            }

            return message.channel.send({ embed: {
                title: 'UPDATED CALL PERMISSIONS',
                description: `Toggled view for <@&${args.role.id}>`,
                fields: [
                    {
                        name: 'VIEW CHANNEL',
                        value: `\`${allow}\``
                    }
                ],
                color: await this.client.config.colors.embed(message.guild),
                timestamp: Date.now()
            }});
        
        } else {

            return message.reply('No user call found. Please type this command in the text channel for a call.')

        }

    };
};

module.exports = ToggleRoleCommand;