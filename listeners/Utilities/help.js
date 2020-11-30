const { Listener } = require('discord-akairo');

class HelpListener extends Listener {
    constructor() {
        super('help', {
            emitter: 'client',
            event: 'help'
        });
    };

    async exec(message, module) {

        function getClass(obj) {
            if (typeof obj === "undefined") return "undefined";
            if (obj === null) return "null";
            return obj.constructor.name;
        }

        const [ type ] = [ getClass(module.handler).replace('Handler', '') ]

        console.log

        message.channel.send({ embed: {
            title: `${type.toUpperCase()}: ${module.id.toUpperCase()}`,
            description: module.description.content,
            fields: [
                {
                    name: 'USAGE',
                    value: (await Promise.all(module.description.usage.map(async str => `\`${await module.handler.prefix(message)}${module.id} ${str}\``))).join('\n')

                },

            ],
            color: this.client.config.colors.discord.blue
        }})
    };
};

module.exports = HelpListener;