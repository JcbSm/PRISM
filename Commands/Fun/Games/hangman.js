const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');
const fs = require('fs')

const commandInfo = commandOptions({
    id: 'hangman',
    aliases: ['hm'],
    description: {
        content: 'Starts a game of hangman',
        usage: ['']
    },
    channel: 'unknown',
    typing: false,
    clientPermissions: ['SEND_MESSAGES', 'EMBED_MESSAGES'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class HangmanCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

    };

    async exec(message, args) {

        function genWord() {
            let data = fs.readFileSync('./Commands/Fun/Games/words.txt', {encoding: 'utf8'});
            let words = data.replace(/\r/gi, '').split('\n')
            return words[Math.floor(Math.random()*words.length)]
        };
    };
};

module.exports = HangmanCommand;