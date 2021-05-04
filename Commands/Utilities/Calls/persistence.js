const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'persistent',
    aliases: ['persistence'],
    description: {
        usage: [''],
        content: 'Toggles whether or not the call with delete itself after everyone leaves',
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['MANAGE_CHANNELS']
}, __dirname);

class PersistentCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async exec(message) {

        let [client] = [this.client];
        const call = (await client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {

            if(call.user_id !== message.author.id && !message.member.permissions.has('MANAGE_CHANNELS')) return message.reply(`Only the owner can user this command.`);

            let res = (await client.db.query(`UPDATE calls SET persistent = NOT persistent WHERE call_id = ${call.call_id} RETURNING persistent`)).rows[0].persistent

            return message.channel.send({ embed: {
                title: 'UPDATED CALL',
                description: `Persistence set to \`${res}\``,
                color: await this.client.config.colors.embed(message.guild),
                timestamp: Date.now()
            }});
        
        } else {

            return message.reply('No user call found.')

        }

    };
};

module.exports = PersistentCommand