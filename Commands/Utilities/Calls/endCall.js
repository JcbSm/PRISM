const { Command } = require('discord-akairo');

class EndCallCommand extends Command {
    constructor() {
        super('endCall', {
            aliases: ['endcall'],
            channel: 'guild'
        });
    };

    async exec(message) {
        
        const call = (await this.client.db.query(`SELECT * FROM calls WHERE text_channel_id = ${message.channel.id}`)).rows[0];

        if(call) {
            if(call.user_id !== message.author.id) return message.reply(`Only the owner can end the call.`);

            try{
                await message.guild.channels.cache.get(call.voice_channel_id).delete();
                await message.channel.delete();

                this.client.db.query(`DELETE FROM calls WHERE call_id = ${call.call_id}`)
            } catch(e) {
                console.log(e)
            }
        } else {
            message.reply('No call found.')
        }
    };
};

module.exports = EndCallCommand;