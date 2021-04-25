const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');
const { loadImage, createCanvas, registerFont } = require('canvas');
const Discord = require('discord.js');
const Color = require('color')

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
        const response = (await message.channel.awaitMessages(m => m.author.id === args.member.id && responses.includes(m.content.toLowerCase()), {max: 1, time: 60000}));
        const accept = response.size > 0 ? response.first().content.toLowerCase().includes('y') ? true : false : false

        if(!accept) {
            message.reply('Your duel has been declined')
        } else {
            
            // Commence Fight

            class Fighter {

                constructor(member) {

                    this.member = member;
                    this.atk = 10;
                    this.def = 1;
                    this.hp = 100;
                    this.alive = true;

                };

                get living() {
                    if(this.hp > 0) {
                        return true
                    } else {
                        return false
                    }
                }

                get name() {
                    return this.member.displayName
                }

                attack(fighter) {
                    
                    let dmg = this.atk - this.def + client.functions.rng(-1, 3);
                    if (dmg < 0) dmg = 0;
                    fighter.hp -= dmg;
                    return dmg

                };

                shieldBreak(fighter) {

                    let dmg = Math.round((this.atk - this.def) / 2);
                    if (dmg < 0) dmg = 0;
                    let def = client.functions.rng(1,2);
                    def = fighter.def - def < 0 ? fighter.def : def;

                    fighter.hp -= dmg; fighter.def -= def;

                    return [dmg, def]

                }

                defend() {
                    
                    let def = client.functions.rng(1,2);
                    this.def += def
                    return def

                };

                surrender() {
                    this.hp = 0
                };

            }

            async function fightImage(fighters) {

                const colors = {
                    health: Color('rgb(59, 176, 0)'),
                    outline: '#ffffff'
                }

                console.log(colors.health)

                const canvas = createCanvas(924, 396)
                const ctx = canvas.getContext('2d')

                ctx.save();

                // Health Bars

                    // Opponent

                    ctx.strokeStyle = colors.outline
                    ctx.lineWidth = '3'
                    ctx.beginPath();
                    ctx.moveTo(canvas.width-150, 80);
                    ctx.lineTo(canvas.width-(150 + 420 + 30), 80)
                    ctx.lineTo(canvas.width-(150 + 420), 110)
                    ctx.lineTo(canvas.width-150, 110);
                    ctx.stroke()

                    ctx.fillStyle = colors.health//.rotate(-(100-fighters[1].hp))
                    ctx.beginPath();
                    ctx.moveTo(canvas.width-150, 83);
                    ctx.lineTo(canvas.width-(150 + (418 * fighters[1].hp/100) + 25), 83)
                    ctx.lineTo(canvas.width-(150 + (418 * fighters[1].hp/100)), 107)
                    ctx.lineTo(canvas.width-150, 107);
                    ctx.fill()

                    // Fighter

                    ctx.beginPath();
                    ctx.moveTo(150, canvas.height-80);
                    ctx.lineTo(150 + 420, canvas.height-80)
                    ctx.lineTo(150 + 420 + 30, canvas.height-110)
                    ctx.lineTo(150, canvas.height-110)
                    ctx.stroke()

                    ctx.fillStyle = colors.health//.rotate(-(100-fighters[0].hp))
                    ctx.beginPath();
                    ctx.moveTo(150, canvas.height-83);
                    ctx.lineTo(150 + (418 * fighters[0].hp/100), canvas.height-83)
                    ctx.lineTo(150 + (418 * fighters[0].hp/100) + 25, canvas.height-107)
                    ctx.lineTo(150, canvas.height-107)
                    ctx.fill()

                ctx.save();
                // Avatars
                
                    // Opponent
                    
                    ctx.beginPath();
                    ctx.arc(canvas.width-96, 96, 64, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(await loadImage(fighters[1].member.user.displayAvatarURL({size: 128, format: 'png'})), canvas.width-160, 32, 128, 128)
                    ctx.restore()

                    // Fighter

                    ctx.beginPath();
                    ctx.arc(96, canvas.height-96, 64, 0, Math.PI * 2, true);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(await loadImage(fighters[0].member.user.displayAvatarURL({size: 128, format: 'png'})), 32, canvas.height-160, 128, 128)
                    ctx.restore()
                
                ctx.restore()

                ctx.strokeStyle = colors.outline
                ctx.lineWidth = '3'
                ctx.beginPath();
                ctx.arc(canvas.width-96, 96, 64, 0, Math.PI * 2, true);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(96, canvas.height-96, 64, 0, Math.PI * 2, true);
                ctx.stroke();
    
                return new Discord.MessageAttachment(canvas.toBuffer(), 'fight.png');

            }
            
            let fighters = [new Fighter(message.member), new Fighter(args.member)];
            let desc = []; let round = 0; let outcome = {}

            // Fight

            while(true) {

                round++;
               
                let sent = await channel.send(`${fighters[0].member}, take your turn...`, { embed: {

                    title: 'FIGHT',
                    description: desc.slice(-5).join('\n')+'\n\nSelect your action:',
                    fields: [
                        {
                            name: '1. ATTACK',
                            value: 'Play offensive',
                            inline: true

                        }, {name: '\u200b', value: '\u200b', inline: true},
                        {
                            name: '2. DEFEND',
                            value: 'Play defensive',
                            inline: true

                        }, {
                            name: '3. SHIELD BERAK',
                            value: 'Weaken your opponents defence',
                            inline: true

                        }, {name: '\u200b', value: '\u200b', inline: true},
                        {
                            name: '4. SURRENDER',
                            value: 'Give up.',
                            inline: true

                        }, 
                        {
                            name: '\u200b',
                            value: `**❤️ ${fighters[0].hp}  //  ⚔️ ${fighters[0].atk}  //  🛡️ ${fighters[0].def}**`
                        },
                        
                    ],
                    color: await this.client.config.colors.embed(message.guild),
                    image: {
                        url: 'attachment://fight.png'
                    }

                }, files: [await fightImage(fighters)]});

                let res = await channel.awaitMessages(m => m.author.id === fighters[0].member.id && ['1', '2', '3', '4'].includes(m.content.toLowerCase()), {max: 1, time: 30000});

                if (!res.first()) {

                    // Miss turn
                    fighters[0].hp -= 5
                    desc.push(`\`[${round}]\` **${fighters[0].member}** ran out of time...`)
                    continue;

                }

                res = Number(res.first().content)
                let [dmg, def] = [];

                switch(res) {

                    case 1:

                        dmg = fighters[0].attack(fighters[1]);
                        desc.push(`\`[${round}]\` **${fighters[1].member}** was hit for \`${dmg}\`.`)
                        break;

                    case 2:

                        def = fighters[0].defend();
                        desc.push(`\`[${round}]\` **${fighters[0].member}** increased their defence by \`${def}\``)
                        break;

                    case 3:

                        [dmg, def] = fighters[0].shieldBreak(fighters[1]);
                        desc.push(`\`[${round}]\` **${fighters[1].member}** was hit for \`${dmg}\`, reducing their defence by \`${def}\`.`)
                        break;

                    case 4:

                        fighters[0].surrender()
                        outcome.reason = 'surrender'
                        break;
                }

                // Win conditions

                if (outcome.reason === 'surrender') {

                    outcome.winner = fighters[1]
                    outcome.loser = fighters[0]

                } else if (fighters[1].hp < 1 && fighters[0].hp > 0) {

                    outcome = {
                        winner: fighters[0],
                        loser: fighters[1],
                        reason: 'defeat'
                    }
                }

                if(outcome.winner) break;

                fighters.reverse();

            }

            await message.channel.send({ embed: {
                title: `**VICTORY TO ${outcome.winner.name.toUpperCase()}**`,
                description: outcome.reason === 'surrender' ? `${outcome.loser.member} surrendered.` : outcome.reason === 'defeat' ? `${outcome.loser.member} was defeated.` : null,
                color: await client.config.colors.embed(message.guild)
            }})

        }

    };
};

module.exports = FightCommand;