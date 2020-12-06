const { Listener } = require('discord-akairo');

class PinListener extends Listener {
    constructor() {
        super('util-pin', {
            emitter: 'client',
            event: 'util-pin'
        });
    };

    async exec(message, channel) {
        console.log(message)

        let embed = {
            description: message.content,
            fields: [
                {
                    name: 'AUTHOR',
                    value: `${message.member}`,
                    inline: true
                },
                {
                    name: 'CHANNEL',
                    value: `${message.channel}`,
                    inline: true
                },
            ],
            // thumbnail: {
            //     url: message.author.displayAvatarURL()
            // },
            author: {
                name: message.author.tag,
                icon_url: message.author.displayAvatarURL()
            },
            timestamp: message.createdTimestamp,
            image: {
                url: null
            },
            color: await this.client.config.colors.embed(message.guild),
        };

        if(message.attachments.first()) {
            try{
                if(message.attachments.first().name.split('.').pop() !== ('png' || 'jpg')) throw err;
                embed.image.url = message.attachments.first().url;
            } catch {
                embed.fields.unshift({
                    name: 'ATTACHMENT',
                    value: `[${message.attachments.first().name}](${message.attachments.first().url})`,
                    inline: true
                })
            }
        }

        if(embed.fields.length % 3 !== 0) {
            for(let i in Array.from({length: 3-(embed.fields.length % 3)})) {
                embed.fields.push(this.client.config.presets.blankFieldInlin)
            }
        }

        channel.send({embed: embed});
    };
};

module.exports = PinListener;