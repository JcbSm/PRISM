const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'toggleuser',
    aliases: ['tuser', 'tusers', 'toggleusers'],
    description: {
        usage: ['[user]', '[user1]; [user2]; [user3];...'],
        content: 'Toggle weather or not users can see the voice chanel'
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['MANAGE_CHANNELS'],
    userPermissions: [],
}, __dirname)

class ToggleUserCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const members = yield {
            type: (message, phrase) => {
                let arr = phrase.split(';');
                let members = { resolved: [], unresolved: [] };
                for(const arg of arr) {
                    if(arg) {
                        try {
                            members.resolved.push(this.client.util.resolveMember(arg.trim(), message.guild.members.cache).user.id)
                        } catch {
                            members.unresolved.push(arg)
                        }
                    } else {
                        continue;
                    }
                }
                if(members.resolved.length === 0 && members.unresolved.length === 0) {
                    return null
                } else {
                    return members;
                }
            },
            match: 'rest',
            prompt: this.client.functions.helpPrompt(message, this)
        };

        return { members }

    };

    async exec(message, args) {
        
        let [client, allow, deny] = [this.client, [], []];
        const call = (await client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {

            if(call.user_id !== message.author.id && !message.member.permissions.has('MANAGE_CHANNELS')) return message.reply(`Only the owner can user this command.`);

            const voiceChannel = message.guild.channels.cache.get(call.voice_channel_id);
            /*const perms = voiceChannel.permissionOverwrites.get(args.role.id);

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
            */
            
            for(const user of args.members.resolved) {
                let perms = voiceChannel.permissionOverwrites.get(user);
                
                let bool = perms ? perms.allow.serialize().VIEW_CHANNEL ? false : true : true;
                voiceChannel.createOverwrite(user, { VIEW_CHANNEL: bool })
                bool ? allow.push(user) : deny.push(user);
            }

            let fields = [
                {
                    name: 'ALLOW',
                    value: allow.length > 0 ? allow.map(u => `<@${u}>`).join('\n') : '`null`',
                    inline: true
                },
                {
                    name: 'DENY',
                    value: deny.length > 0 ? deny.map(u => `<@${u}>`).join('\n') : '`null`',
                    inline: true
                },
            ];

            args.members.unresolved.length > 0 ? fields.push({
                name: 'UNRESOLVED',
                value: args.members.unresolved.map(u => `\`${u.trim()}\``).join('\n')
            }) : null

            return message.channel.send({ embed: {
                title: 'UPDATED CALL PERMISSIONS',
                description: `Toggled voice channel view for users`,
                fields: fields,
                color: await this.client.config.colors.embed(message.guild),
                timestamp: Date.now()
            }});
        
        } else {

            return message.reply('No user call found.')

        }

    };
};

module.exports = ToggleUserCommand;