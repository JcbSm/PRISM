const { Command } = require('discord-akairo');
const { loadImage, createCanvas, registerFont } = require('canvas');
const Discord = require('discord.js')
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'rank',
    aliases: [],
    channel: 'giuld',
    typing: true,
    description: {
        usage: ['(member)'],
        content: 'View the level and rank of a member.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []

}, __dirname)

class RankCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const member = yield {
            type:'member',
            default: message => message.member
        };

        return { member };

    };

    async exec(message, args) {

        const [DB, member] = [this.client.db, args.member]

        try{

            const memberData = (await DB.query(`SELECT * FROM members WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)).rows[0]
            const guildData = (await DB.query(`SELECT rank_card_color FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0]

            //Colours
            const colors = {
                bg: '#242424',
                highlight: '#ffffff',
                highlightDark: '#ababab',
                border: '#1c1c1c',
                main: guildData.rank_card_color
            }

            registerFont('./Assets/Fonts/bahnschrift-main.ttf', {family: 'bahnschrift'})

            const canvas = createCanvas(640, 192)
            const ctx = canvas.getContext('2d')

            let rank = 0;

            const avatar = await loadImage(member.user.displayAvatarURL({size: 128, format: 'png'}));
            let statusColor;
            switch(member.user.presence.status) {
                case 'online':
                    statusColor = '#5cb85c'
                    break;
                case 'idle':
                    statusColor = '#f0ad4e'
                    break;
                case 'dnd':
                    statusColor = '#d9454f'
                    break;
                case 'offline':
                    statusColor = '#545454'
                    break;
            }

            ctx.save()

            //Fill BG
            ctx.fillStyle = colors.bg
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            //Outline
            ctx.lineWidth = 10
            ctx.strokeStyle = colors.border
            ctx.strokeRect(0, 0, canvas.width, canvas.height)

            //Draw Avatar
            ctx.beginPath();
            ctx.arc(96, 96, 64, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 32, 32, 128, 128)

            ctx.restore()

            //Outline Avatar
            ctx.beginPath();
            ctx.arc(96, 96, 70, 0, Math.PI * 2, true);
            ctx.strokeStyle = colors.bg
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.strokeStyle = colors.highlight
            ctx.lineWidth = 2;
            ctx.stroke();

            //Status
            ctx.beginPath();
            ctx.arc(144, 144, 18, 0, Math.PI * 2, true);
            ctx.fillStyle = statusColor;
            ctx.fill();
            ctx.strokeStyle = colors.bg
            ctx.lineWidth = 4;
            ctx.stroke();

            //Calc Level
            const level = this.client.functions.levelCalc(memberData.xp)
            
            //Bar constants
            const [barX, barY, barRad, barLen] = [192, 128, 16, 400]
            const minXP = this.client.functions.xpCalc(level);
            const maxXP = this.client.functions.xpCalc(level+1);
            const currentXP = memberData.xp-minXP;
            const progress = (memberData.xp - minXP)/(maxXP - minXP)

            //Outline Bar
            ctx.beginPath();
            ctx.arc(barX, barY, (barRad+2), -Math.PI/2, Math.PI/2, true);
            ctx.lineTo(barX+barLen, barY+(barRad+2));
            ctx.arc(barX+barLen, barY, (barRad+2), Math.PI/2, -Math.PI/2, true);
            ctx.lineTo(barX, barY-(barRad+2));
            ctx.strokeStyle = colors.bg
            ctx.lineWidth = 8;
            ctx.stroke();
            ctx.strokeStyle = colors.highlight;
            ctx.lineWidth = 2;
            ctx.stroke();

            //Fill Bar
            let newBarLen = barLen * progress
            ctx.beginPath();
            ctx.arc(barX, barY, (barRad-2), -Math.PI/2, Math.PI/2, true);
            ctx.lineTo(barX+newBarLen, barY+(barRad-2));
            ctx.arc(barX+newBarLen, barY, (barRad-2), Math.PI/2, -Math.PI/2, true);
            ctx.lineTo(barX, barY-(barRad-2));

            ctx.strokeStyle = colors.bg
            ctx.lineWidth = 5
            ctx.stroke();
            ctx.fillStyle = colors.main;
            ctx.fill();

            //Text
            const applyText = (canvas, text, size) => {
                const ctx = canvas.getContext('2d');
                let fontSize = size;
                do {
                    ctx.font = `${fontSize -= 5}px "bahnschrift"`;
                } while (ctx.measureText(text).width > barLen);
                return ctx.font;
            };

            //Name
            ctx.strokeStyle = colors.bg
            ctx.lineWidth = 5

            ctx.font = applyText(canvas, member.user.tag, 32);
            ctx.fillStyle = colors.highlight;
            ctx.strokeText(member.user.tag, barX, barY-barRad-10)
            ctx.fillText(member.user.tag, barX, barY-barRad-10)

            //Progress
            const progStr = `${this.client.functions.groupDigits(currentXP)} / ${this.client.functions.groupDigits(maxXP - minXP)} xp`
            ctx.font = applyText(canvas, progStr, 26);
            ctx.strokeText(progStr, barX, barY+barRad+28)
            ctx.fillStyle = colors.highlightDark;
            ctx.fillText(progStr, barX, barY+barRad+28)
            
            //Level
            ctx.fillStyle = colors.main
            ctx.font = '48px "bahnschrift"';
            let numWidth = ctx.measureText(`${level}`).width;
            ctx.strokeText(`${level}`, 608-numWidth, 52)
            ctx.fillText(`${level}`, 608-numWidth, 52)
            ctx.font = '32px "bahnschrift"';
            let textWidth = ctx.measureText(`Level `).width;
            ctx.strokeText(`Level `, 608-textWidth-numWidth, 52)
            ctx.fillText(`Level `, 608-textWidth-numWidth, 52)

            const levelWidth = numWidth+textWidth;

            //Rank
            ctx.fillStyle = colors.highlightDark
            ctx.font = '48px "bahnschrift"';
            numWidth = ctx.measureText(`#${rank}`).width;
            ctx.strokeText(`#${rank}`, 592-numWidth-levelWidth, 52)
            ctx.fillText(`#${rank}`, 592-numWidth-levelWidth, 52)
            ctx.font = '32px "bahnschrift"';
            textWidth = ctx.measureText(`Rank `).width;
            ctx.strokeText(`Rank `, 592-textWidth-numWidth-levelWidth, 52)
            ctx.fillText(`Rank `, 592-textWidth-numWidth-levelWidth, 52)

            const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'Rank-.png');

	        message.channel.send('', attachment);

        } catch(e) {
            console.log(e)
        }
    };
};

module.exports = RankCommand;