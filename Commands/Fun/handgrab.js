const { Command } = require('discord-akairo');
const { MessageAttachment } = require('discord.js');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'handgrab',
    aliases: ['hand'],
    description: {
        usage: [''],
        content: 'Trap someone.'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES', 'ATTACH_FILES'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class HandgrabCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    * args(message) {

        const type = yield {
            type: [
                ['normal'],
                ['thanos'],
                ['laser', 'lazer']
            ],
            default: 'normal'
        }

        return { type };

    };

    async exec(message, args) {

        let urls = {
            normal: {
                top: 'https://i.imgur.com/Sv6kz8f.png',
                bottom: 'https://i.imgur.com/wvUPp3d.png'
            },
            thanos: {
                top: 'https://i.imgur.com/7kjMLYJ.png',
                bottom: 'https://i.imgur.com/d5TxlJo.png'
            },
            laser: {
                top: 'https://i.imgur.com/Ngx8zDt.png',
                bottom: 'https://i.imgur.com/iyyggjV.png'
            }
        };

        let url = urls[args.type];

        let top = await message.channel.send(new MessageAttachment(url.top, 'top.png'));

        message.delete();

        try {
            await message.channel.awaitMessages(m => !m.author.bot, {max: 1, time: 60000, errors: ['time'] });
            return await message.channel.send(new MessageAttachment(url.bottom, 'bottom.png'));
        } catch (e) {
            return top.delete();
        };

    };

};

module.exports = HandgrabCommand;