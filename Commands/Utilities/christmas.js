const { Command } = require('discord-akairo');
const { min } = require('moment');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'christmas',
    aliases: ['xmas'],
    description: {
        usage: [''],
        content: 'See how far away christmas is.'
    },
    channel: null,
    typing: true,
    clientPermissions: [],
    userPermissions: [],
}, __dirname)

class ChristmasCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

    };

    async exec(message, args) {

        let currentDate = new Date();
        let christmasYear = (currentDate.getMonth() === 11 && currentDate.getDate() >= 25) ? currentDate.getFullYear() + 1: currentDate.getFullYear();
        
        let nextChristmas = new Date(christmasYear, 11, 25);
        
        let days = Math.ceil((nextChristmas.getTime() - currentDate.getTime())/(1000*60*60*24))

        return message.channel.send({ embed: {
            title: 'CHRISTMAS IS SOON',
            description: `Only \`${days}\` sleeps until christmas ${christmasYear}!!!`,
            color: await this.client.config.colors.embed(message.guild)
        }})
    };
};

module.exports = ChristmasCommand;