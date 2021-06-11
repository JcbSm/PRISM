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

        async function genWord() {
            let words;
            fs.readFile('./Commands/Fun/Games/words.txt', (err, data) => {
                if (err) throw err;

                console.log(data.toString().split())
            });
            return words
        };

        genWord();
    };
};

module.exports = HangmanCommand;