const { Command, SequelizeProvider } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'xpcalc',
    aliases: [],
    typing: false,
    channel: 'guild',
    description: {
        usage: ['[level] (current xp)'],
        content: 'Calculate the xp required to reach a level'
    },
    clientPermissions: [],
    userPermissions: []
}, __dirname);

class XpCalcCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args(message) {

        const level = yield {
            type: 'number',
            prompt: this.client.functions.helpPrompt(message, this)
        };

        const xp = yield {
            type: 'number',
            default: 0
        };

        return { level, xp };

    };

    async exec(message, { level, xp }) {

        let rXP = this.client.functions.xpCalc(level)-xp;

        return message.channel.send({ embed: {
            title: 'XP CALCULATOR',
            description: xp > 0 ? `Required XP to reach level \`${level}\` from \`${this.client.functions.groupDigits(xp)} xp\`` : `Required XP to reach level \`${level}\``,
            fields: [
                {
                    name: 'REQUIRED XP',
                    value: `\`${this.client.functions.groupDigits(rXP)}\``,
                    inline: true
                },
                xp > 0 ? {
                    name: 'TOTAL XP',
                    value: `\`${this.client.functions.groupDigits(this.client.functions.xpCalc(level))}\``,
                    inline: true
                } : { name: '\u200b', value: '\u200b', inline: true }
            ],
            timestamp: Date.now(),
            color: await this.client.config.colors.embed(message.guild)
        }});

    }

};

module.exports = XpCalcCommand