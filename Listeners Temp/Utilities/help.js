const { Listener, Category } = require('discord-akairo');

class HelpListener extends Listener {
    constructor() {
        super('help', {
            emitter: 'client',
            event: 'help'
        });
    };

    async exec(message, module, category) {

        let embed;

        if(!module && category) {

            embed = {
                description: 'Help for categories is not yet supported'
            }
            
        } else if(module && !category) {

            function getClass(obj) {
                if (typeof obj === "undefined") return "undefined";
                if (obj === null) return "null";
                return obj.constructor.name;
            }

            const [ type ] = [ getClass(module.handler).replace('Handler', '') ]

            embed = {
                title: `${type.toUpperCase()}: ${module.id.toUpperCase()}`,
                description: module.description.content,
                fields: [
                    {
                        name: 'USAGE',
                        value: (await Promise.all(module.description.usage.map(async str => `\`${await module.handler.prefix(message)}${module.id} ${str}\``))).join('\n')
                    },

                ],
                color: await this.client.config.colors.embed(message.guild)
            }

            if(module.description.argumentOptions) {

                for(let arg of module.description.argumentOptions) {

                    embed.fields.push({
                        name: arg.id.toUpperCase(),
                        value: arg.options.map(e => `- \`${e[0]}\``).join('\n'),
                        inline: true
                    })
                }
            }

        };

        message.channel.send({embed: embed})
    };
};

module.exports = HelpListener;