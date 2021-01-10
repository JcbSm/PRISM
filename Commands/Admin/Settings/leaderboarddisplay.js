const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'leaderboarddisplay',
    aliases: ['lbdisplay', 'servertopdisplay'],
    description: {
        usage: ['[normal|anonymous|none]'],
        content: 'Set whether or not to appear on -servertop commands.'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
}, __dirname)

class LeaderboardDisplayCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        let options = [
            ['NORMAL', 'DEFAULT', 'RESET', '1'],
            ['ANONYMOUS', 'ANON', '2'],
            ['NONE', 'DISABLE', '3']
        ];

        const option = yield {
            type: options,
            prompt: this.client.functions.prompt(this.client.functions.optionEmbed(options, await this.client.config.presets.defaultOptions(message.guild)))
        };

        return { option }

    };

    async exec(message, { option }) {

        let int;

        switch (option) {

            case 'NORMAL':

                int = 0;
                break;
            
            case 'ANONYMOUS':
                
                int = 1;
                break;

            case 'NONE':

                int = 2;
                break;

        };

        await this.client.db.query(`UPDATE guilds SET leaderboard_display = ${int} WHERE guild_id = ${message.guild.id}`);

        return message.channel.send({ embed: {
            title: 'LEADERBOARD DISPLAY UPDATED',
            description: `Set display to \`${option}\``,
            timestamp: Date.now(),
            color: await this.client.config.colors.embed(message.guild)
        }});
    };
};

module.exports = LeaderboardDisplayCommand;