const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'endcall',
    aliases: [],
    channel: 'guild',
    typing: false,
    description: {
        usage: [''],
        content: 'Ends a user generated call'
    },
    clientPermissions: ['MANNAGE_CHANNELS', 'SEND_MESSAGES'],
    userPermissions: []
}, __dirname)

class EndCallCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async exec(message) {
        
        let client = this.client;
        const call = (await client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {

            if(call.user_id !== message.author.id && !message.member.permissions.has('MANAGE_CHANNELS')) return message.reply(`Only the owner can end the call.`);
            
            let timeout = setTimeout(function () {
                client.emit('calls-end', call.call_id); 
            }, 10000);

            await message.reply('This call will be deleted in 10 seconds, type `cancel` to cancel');
            await message.channel.awaitMessages((m => m.author.id === message.author.id && m.content.toLowerCase() === 'cancel'), {
                max: 1,
                time: 10000
            }).then(collected => {
                clearTimeout(timeout)
                if(collected.size > 0) {
                    message.channel.send({ embed: {
                        description: '`CANCELLED`',
                        color: client.config.colors.red
                    }})
                }
            })

        } else {
            message.reply('No user call found.')
        }
    };
};

module.exports = EndCallCommand;