/*
const { Command } = require('discord-akairo');
const { colors } = require('../../../config')

class UserLimitCommand extends Command {
    constructor() {
        super('userLimit', {
            aliases: ['userLimit'],
            description: {
                content: 'Sets the user limit for the channel',
                usage: 'userlimit <number>'
            },
            category: 'calls',
            args: [
                {
                    id: 'num',
                    type: 'number',
                    default: 0
                }
            ]
        })
    }

    async exec(message, args) {
        try{        
        
        if(message.guild.id === '447504770719154192' || message.guild.id === '742026925156860026' || message.guild.id === '361569079514890252') {

            const guild = message.guild
            const everyoneRole = message.guild.roles.cache.find(r => r.name === '@everyone')

            if(args.num > 99) return message.reply('Max user count is 99')

            if(message.channel.topic.split(';')[0] !== 'PRIVATE CALL') return message.reply('This is not a private call text channel, please either make one or use an existing one.');
            if(message.channel.topic.split(';')[0] === 'PRIVATE CALL') {

                const voiceChannel = message.guild.channels.cache.get(message.channel.topic.split(';')[2])

                await voiceChannel.setUserLimit(args.num)
                message.channel.send({ embed: {

                    type: 'rich',
                    title: `Updated ${voiceChannel.name}`,
                    description: `User limit: \`${args.num}\``,
                    color: colors.purple,
                    timestamp: new Date()
                }})
            }

        }
    
    }catch(error){console.log(error)}

    }
}

module.exports = UserLimitCommand
*/

const { Command } = require('discord-akairo');
const { values } = require('lodash');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'userlimit',
    aliases: [],
    description: {
        usage: ['(size)'],
        content: 'Change the user limit on a call. Anything from `1-99`.\nSet to `0` for unlimited'
    },
    channel: 'guild',
    typing: true,
    clientPermissions: ['MANAGE_CHANNELS'],
    userPermissions: [],
}, __dirname)

class UserLimitCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const num = yield {
            type: (message, phrase) => {
                let value = Math.floor(Number(phrase));
                if(value < 0 || value > 99) value = undefined;
                return value;
            },
            prompt: this.client.functions.helpPrompt(message, this)
        };

        return { num }

    };

    async exec(message, args) {

        let [client] = [this.client];
        const call = (await client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {

            if(call.user_id !== message.author.id && !message.member.permissions.has('MANAGE_CHANNELS')) return message.reply(`Only the owner can user this command.`);

            const voiceChannel = message.guild.channels.cache.get(call.voice_channel_id);

            await voiceChannel.setUserLimit(args.num)

            return message.channel.send({ embed: {
                title: 'UPDATED USERLIMIT',
                description: `Changed the user limit to \`${args.num}\``,
                color: await this.client.config.colors.embed(message.guild),
                timestamp: Date.now()
            }});
        
        } else {

            return message.reply('No user call found.')

        }

    };
};

module.exports = UserLimitCommand;