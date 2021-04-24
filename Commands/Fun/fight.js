const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');
const { loadImage, createCanvas, registerFont } = require('canvas');
const Discord = require('discord.js');
const { at } = require('lodash');

const commandInfo = commandOptions({
    id: 'fight',
    aliases: ['duel'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[opponent]'],
        content: 'Challenge another user to a duel.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class FightCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const member = yield {
            type: 'member',
            prompt: this.client.functions.helpPrompt(message, this)
        };

        return { member }
    };

    async exec(message, args) {

        let [client, channel] = [this.client, message.channel]

        message.channel.send(`⚔️ ${args.member}, you have been challenged to a duel by ${message.member} ⚔️`, {embed: {
            title: 'DUEL',
            description: 'Type **\'Y/N\'** to accept or decline',
            fields: [
                {
                    name: 'Challanger',
                    value: `${message.member}`,
                    inline: true
                },
                {
                    name: 'Opponent',
                    value: `${args.member}`,
                    inline: true
                }
            ],
            color: await this.client.config.colors.embed(message.guild)
        }})

        const responses = ['yes', 'y', 'no', 'n']
        const response = (await message.channel.awaitMessages(m => m.author.id === m.member.id && responses.includes(m.content.toLowerCase()), {max: 1, time: 10000}))//;
        const accept = response.size > 0 ? response.first().content.toLowerCase().includes('y') ? true : false : false

        if(!accept) {
            message.reply('Your duel has been declined')
        } else {
            
            // Commence Fight

            class Fighter {

                constructor(member) {

                    this.member = member;
                    this.attack = 10;
                    this.defence = 10;
                    this.hp = 100;
                    this.alive = true
                };

                get living() {
                    if(this.hp > 0) {
                        return true
                    } else {
                        return false
                    }
                }

                attack() {
                    console.log(`${this.member.displayName} attacked`)
                };

                defend() {
                    console.log(`${this.member.displayName} defended`)
                };

                surrender() {
                    console.log(`${this.member.displayName} surrendered`)
                };

            }

            async function fightStage(fighters) {

                const canvas = createCanvas(1280, 720)
                const ctx = canvas.getContext('2d')
    
                const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'fight.png');
    
                const embed = new Discord.MessageEmbed({
                    color: await client.config.colors.embed(message.guild)
                }).attachFiles(attachment).setImage('attachment://fight.png')

                message.channel.send({embed: embed})

            }
            
            let fighters = [new Fighter(message.member), new Fighter(args.member)];
            let [turn] = [0]
            // Fight

            while(true) {

                turn = turn === 0 ? 1 : 0
               
                channel.send(`**PLAYER ${turn+1}:** ${fighters[turn].member}, take your turn`)
                console.log('Awaiting player to take turn...')

                let res = await channel.awaitMessages(m => m.author.id === m.member.id && ['1', '2', '3'].includes(m.content.toLowerCase()), {max: 1, time: 10000})

                console.log(`${res.content} chosen`)
            }

        }

    };
};

module.exports = FightCommand;