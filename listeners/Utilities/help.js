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

        let embed = {
            title: `${type.toUpperCase()}: ${module.id.toUpperCase()}`,
            description: module.description.content,
            fields: [
                {
                    name: 'USAGE',
                    value: (await Promise.all(module.description.usage.map(async str => `\`${await module.handler.prefix(message)}${module.id} ${str}\``))).join('\n')
                },

            ],
            color: this.client.config.colors.discord.blue
        }

        if(module.description.argumentOptions) {
            for(let arg of module.description.argumentOptions) {

                console.log(arg)
                embed.fields.push({
                    name: arg.id.toUpperCase(),
                    value: arg.options.map(e => `- \`${e[0]}\``).join('\n'),
                    inline: true
                })
            }
        }

        message.channel.send({embed: embed})
    };
};

module.exports = HelpListener;