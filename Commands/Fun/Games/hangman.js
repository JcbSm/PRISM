const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');
const { createCanvas } = require('canvas');
const fs = require('fs')

const commandInfo = commandOptions({
    id: 'hangman',
    aliases: ['hm'],
    description: {
        content: 'Starts a game of hangman',
        usage: ['', 'multiplayer']
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

        let multiplayer = yield {
            type: [
                ['MULTIPLAYER', 'MP', 'MTP', 'TRUE']
            ]
        };

        multiplayer = multiplayer ? true : false

        return { multiplayer }

    };

    async exec(message, { multiplayer }) {

        function randWord() {
            let data = fs.readFileSync('./Commands/Fun/Games/words.txt', {encoding: 'utf8'});
            let words = data.replace(/\r/gi, '').split('\n')
            return words[Math.floor(Math.random()*words.length)].toUpperCase();
        };

        function parseWord(word) {

            let parsed = [];

            for (let char of word.split('')) {
                let obj = {};
                obj.char = char;
                if (/[A-Z]/i.test(char)) {
                    obj.display = '\\_';
                    obj.guessed = false
                } else {
                    obj.display = char;
                    obj.guessed = true;
                };
                parsed.push(obj)
            };

            return parsed;

        };

        function displayWord(parsedWord) {
            return parsedWord.map(w => {
                if (w.char === ' ') return ' \\/'
                return w.guessed ? w.char : w.display
            }).join(' ')
        };

        async function hangmanImage(lives) {

            let lineWidth = 4;

            const canvas = createCanvas(400, 200);
            const ctx = canvas.getContext('2d');

            ctx.strokeStyle = '#fff'; ctx.lineWidth = lineWidth;

            ctx.beginPath();
            ctx.moveTo(0, canvas.height - lineWidth/2);
            ctx.lineTo(canvas.width/2, canvas.height - lineWidth/2);

            switch (lives) {
                case 0:
                    ctx.moveTo(canvas.width/3, 3*canvas.height/5);
                    ctx.lineTo(canvas.width/3 + canvas.width/20, 7*canvas.height/8);
                case 1:
                    ctx.moveTo(canvas.width/3, 3*canvas.height/5);
                    ctx.lineTo(canvas.width/3 - canvas.width/20, 7*canvas.height/8);
                case 2:
                    ctx.moveTo(canvas.width/3, 9*canvas.height/25);
                    ctx.lineTo(canvas.width/3 + canvas.width/20, canvas.height/2)
                case 3:
                    ctx.moveTo(canvas.width/3, 9*canvas.height/25);
                    ctx.lineTo(canvas.width/3 - canvas.width/20, canvas.height/2)
                case 4:
                    ctx.moveTo(canvas.width/3, canvas.height/8 + 2*canvas.height/12);
                    ctx.lineTo(canvas.width/3, 3*canvas.height/5);
                case 5:
                    ctx.moveTo(canvas.width/3, canvas.height/8)
                    ctx.arc(canvas.width/3, canvas.height/8 + canvas.height/12, canvas.height/12, -Math.PI/2, 3*Math.PI/2);
                case 6:
                    ctx.moveTo(canvas.width/3, 0);
                    ctx.lineTo(canvas.width/3, canvas.height/8)
                case 7:
                    ctx.moveTo(canvas.width/15, canvas.height/5);
                    ctx.lineTo(canvas.width/15 + canvas.height/5, lineWidth/2);
                case 8:
                    ctx.moveTo(canvas.width/15, lineWidth/2);
                    ctx.lineTo(canvas.width/2.5, lineWidth/2);
                case 9:
                    ctx.moveTo(canvas.width/15, canvas.height);
                    ctx.lineTo(canvas.width/15, 0);
            }

            ctx.stroke();

            return canvas.toBuffer()
        };

        let word;

        if (multiplayer) {
            try {
                await message.author.send(`Send the hangman word here.`);
                word = parseWord((await message.author.dmChannel.awaitMessages(m => m.author.id === message.author.id, { max: 1, time: 30*1000 })).first().content.toUpperCase());
                await message.author.send('Starting...')
            } catch {
                word = parseWord(randWord());
            };
        } else {
            word = parseWord(randWord());
        };

        if (!word) return message.reply({ embed: { description: '`ERROR: Word missing`'}})

        let lives = 10; let incorrect = []; let guessed = []; let alert = ''; let guess;
        let sent; let lastSent;

        while (word.some(w => !w.guessed) && lives > 0) {

            sent = await message.channel.send(alert, { files: [{ attachment: await hangmanImage(lives), name: 'hangman.png' }], embed: {
                title: 'HANGMAN',
                description: 'Type a letter to guess',
                fields: [
                    {
                        name: '\u200b',
                        value: `${displayWord(word)}\n\u200b`
                    },
                    {
                        name: 'WRONG LETTERS',
                        value: incorrect.length > 0 ? incorrect.join(' ') : '\u200b'
                    }
                ],
                footer: {
                    text: `LIVES: ${lives}`
                },
                image: {
                    url: 'attachment://hangman.png'
                }
            }});
            lastSent ? lastSent.delete() : null;
            lastSent = sent;

            // Fetch the guess

            let msg = (await message.channel.awaitMessages(m => /^[A-Z]{1}$/i.test(m.content), { max: 1, time: 20*1000})).first();
            guess = msg ? msg.content.toUpperCase() : null;

            // Check not already guessed.

            if (!guess) {
                alert = 'Nobody guessed...'
                lives--;
                continue;
            } else if (guessed.includes(guess) || incorrect.includes(guess)) {
                alert = `\`${guess}\` has already been guessed.`
                continue;
            }

            // Guess

            if (word.some(w => w.char === guess)) {
                guessed.push(guess);
                word.filter(w => w.char === guess).forEach(c => {
                    c.guessed = true
                });
                alert = `**${msg.member.displayName}** correctly guessed \`${guess}\`.`
            } else {
                lives--;
                incorrect.push(guess);
                alert = `**${msg.member.displayName}** incorrectly guessed \`${guess}\`.`
            };
        };

        if (lives === 0) return message.channel.send({ files: [{ attachment: await hangmanImage(lives), name: 'hangman.png' }], embed: {
            title: 'LOSER',
            description: 'You have been hung. You died.',
            color: this.client.config.colors.red,
            fields: [
                {
                    name: 'WORD',
                    value: `${word.map(w => w.char).join('')}`
                },
                {
                    name: 'CORRECT GUESSES',
                    value: guessed.length > 0 ? guessed.join(' ') : '\u200b'
                },
                {
                    name: 'INCORRECT GUESSES',
                    value: incorrect.length > 0 ? incorrect.join(' ') : '\u200b'
                }
            ],
            image: {
                url: 'attachment://hangman.png'
            }
        }}); 
        else return message.channel.send({ embed: {
            title: 'WINNER',
            description: 'You correctly guessed! You live another day.',
            color: this.client.config.colors.green,
            fields: [
                {
                    name: 'WORD',
                    value: `${word.map(w => w.char).join('')}`
                },
                {
                    name: 'CORRECT GUESSES',
                    value: guessed.length > 0 ? guessed.join(' ') : '\u200b'
                },
                {
                    name: 'INCORRECT GUESSES',
                    value: incorrect.length > 0 ? incorrect.join(' ') : '\u200b'
                }
            ]
        }}); 
    };
};

module.exports = HangmanCommand;