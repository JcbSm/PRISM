const { Command } = require('discord-akairo');
const Weapon = require('../../Classes/RPG/weapon');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'duel',
    aliases: ['fight'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[opponent]'],
        content: 'Challenge another user to a duel.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class DuelCommand extends Command {

    constructor() { super(commandInfo.id, commandInfo); };

    async *args(message) {

        const member = yield {
            type: 'member',
            prompt: this.client.functions.helpPrompt(message, this)
        };

        return { member }
    };

    async exec(message, args) {

        const Duel = require('../../Classes/RPG/duel'); const Player = require('../../Classes/RPG/player');

        const duel = new Duel([
            new Player(message.member, {
                hp: 100,
                atk: 10
            }),
            new Player(args.member, {
                hp: 100,
                atk: 5
            })
        ], message.channel, this.client);
        
    };

};

//module.exports = DuelCommand;