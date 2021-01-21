const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'move',
    aliases: [],
    channel: 'guild',
    typing: false,
    description: {
        content: 'Move members from one voice channel to another.',
        usage: ['[voice-channel] [member]', '[voice-channel] all', '[voice-channel] [ member1; member2; member3... ]']
    },
    clientPermissions: ['MOVE_MEMBERS'],
    userPermissions: ['MOVE_MEMBERS'],
}, __dirname)

class MoveCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const channel = yield {
            type: 'voiceChannel',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this);
                },
            }
        };

        const input = yield {
            match: 'rest',
            default: 'all'
        };

        let [members, unresolved] = [[], []];
        
        if(input.toLowerCase() !== 'all' && message.member.voice.channel) {

            let arr = input.split(';');
            for(let str of arr) {
                let member = this.client.util.resolveMember(str.trim(), message.member.voice.channel.members)
                member ? members.push(this.client.util.resolveMember(str.trim(), message.member.voice.channel.members)) : unresolved.push(str)
            };

        } else if(input.toLowerCase() === 'all' && message.member.voice.channel) {

            for(let [_, member] of message.member.voice.channel.members) {
                members.push(member)
            }

        }

        return { channel, members, unresolved }

    };

    async exec(message, args) {

        if(!message.member.voice.channel) return message.reply('You are not in a voice channel.');
        if(args.members.length < 1) return message.reply('No members found to move');

        for(const member of args.members) {
            await member.voice.setChannel(args.channel.id);
        };

        return await message.channel.send({ embed: {
            title: 'MOVED MEMBERS',
            description: `Successfully moved \`${args.members.length}\` members to ${args.channel}`,
            fields: [
                {
                    name: 'MEMBERS',
                    value: args.members.map(m => `<@${m.id}>`).join('\n'),
                    inline: true
                },
                {
                    name: 'UNRESOLVED',
                    value: args.unresolved.length > 0 ? args.unresolved.map(u => `\`${u}\``).join('\n') : '`null`',
                    inline: true
                }
            ],
            timestamp: Date.now(),
            color: await this.client.config.colors.embed(message.guild)
        }});

    };

};

module.exports = MoveCommand;