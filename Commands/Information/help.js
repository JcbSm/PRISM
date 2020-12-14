const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'help',
    aliases: [],
    channel: null,
    typing: true,
    description: {
        usage: ['', '(command)', '(category)'],
        content: 'Get help.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname)

class HelpCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        let [ input, category, command ] = [yield];

        if(input) {
            if(this.handler.categories.map(c => c.id.toLowerCase()).includes(input.toLowerCase())) {
                category = this.handler.findCategory(input.toLocaleLowerCase())
            } else if(this.handler.modules.map(c => c.id.toLocaleLowerCase()).includes(input.toLowerCase())) {
                command = this.handler.findCommand(input.toLowerCase());
            }
        };

        return { category, command }
    };

    async exec(message, args) {

        if(args.category) {
            this.client.emit('help', message, null, args.category)
        } else if(args.command) {
            this.client.emit('help', message, args.command)
        } else {
            const [categories, prefix] = [this.handler.categories.sort((a, b) => b.size - a.size).filter(c => c.id !== 'default'), await this.handler.prefix(message)];
            let arr = [];

            categories.forEach(c => {
                arr.push({
                    name: c.id.toUpperCase(),
                    value: `${c.map(command => `${prefix}${command.id}`).join('\n')}\n\u200b`,
                    inline: true
                })
            })

            message.channel.send({ embed: {
                title: `${this.client.user.username.toUpperCase()} COMMANDS`,
                description: `A list of all the commands available with this bot.\nSome may not be enabled on this server.\n\u200b`,
                fields: arr,
                thumbnail: {
                    url: this.client.user.displayAvatarURL()
                },
                color: await this.client.config.colors.embed(message.guild),
                timestamp: Date.now(),
                footer: {
                    text: `Type '${prefix}help (command)' for more information.`
                }
            }})
        }
    };
};

module.exports = HelpCommand;
