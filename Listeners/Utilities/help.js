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
                title: `${category.id.toUpperCase()} COMMANDS`,
                description: `Here is a list of the available commands.\nType \`${await this.client.commandHandler.prefix(message)}help [command]\` for more information`,
                fields: category.map(c => {
                    return {
                        name: c.id.toUpperCase(),
                        value: `${c.description.content}\n\u200b`,
                        inline: true
                    }
                })
            }

            for(let i = 0; i < embed.fields.length; i++) {

                i % 3 === 1 ? embed.fields.splice(i, 0, { name: '\u200b', value: '\u200b', inline: true }) : null;

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

                ]
            }

            if(module.description.argumentOptions) {

                embed.fields.push({
                    name: '\u200b',
                    value: 'ARGUMENT OPTIONS:'
                })

                for(let arg of module.description.argumentOptions) {

                    embed.fields.push({
                        name: `${arg.id.toUpperCase()}`,
                        value: arg.options.map(e => `- \`${e[0]}\``).join('\n'),
                        inline: true
                    })
                }
            }

        };

        embed.color =  await this.client.config.colors.embed(message.guild);
        embed.timestamp = Date.now();

        message.channel.send({embed: embed})
    };
};

module.exports = HelpListener;