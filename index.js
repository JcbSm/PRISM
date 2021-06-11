console.log('Initialising');

module.exports = { 
    
    commandOptions: function commandOptions(obj, dir) {

        let options = {
            id: obj.id,
            aliases: obj.aliases,
            channel: obj.channel,
            typing: obj.typing,
            description: obj.description,
            clientPermissions: obj.clientPermissions,
            userPermissions: obj.userPermissions,
            category: dir.split(/(\\|\/)/).pop()
        };

        options.aliases.unshift(obj.id)

        for(const key of Object.keys(options)) {
            let x = options[key]
            if(x === undefined) throw `Command Options Missing - ${key}`;
        }

        Object.assign(options, obj)

        return options;
        
    }
};

const { AkairoClient, CommandHandler, ListenerHandler, InhibitorHandler } = require('discord-akairo');
const { Client } = require('pg');
const { loadImage, createCanvas, registerFont } = require('canvas');
const { canvasRGBA } = require('stackblur-canvas')
const Color = require('color')
const fs = require('fs');

let [credentials, testing] = [];
try{
    credentials = require('./credentials.json');
    testing = true;
} catch {
    credentials = process.env;
    testing = false;
}

const db = new Client({
    connectionString: credentials.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async function() {
    console.log('Connecting to DB...');
    try{
        await db.connect();
        console.log('Connection established');
    } catch (error) {
        console.log(error);
    };
}());

class BotClient extends AkairoClient {
    constructor() {
        super({
            ownerID: '227848397447626752',
        }, {
            disableEveryone: true,
            allowMention: true,
            partials: ['MESSAGE', 'REACTION']
        });

        this.commandHandler = new CommandHandler(this, {
                directory: './Commands/',
                prefix: async message => {
                    try{
                        return (await db.query(`SELECT prefix FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].prefix;
                    } catch(err) {
                        //console.log(err)
                        return ';'
                    }
                },
                commandUtil: true
            }
        );
        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './Inhibitors/'
        });

        this.listenerHandler = new ListenerHandler(this, {
            directory: './Listeners/'
        });

        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler
        });
        
        console.log('Loading Modules...');
        this.commandHandler.loadAll();
        this.listenerHandler.loadAll();
        this.inhibitorHandler.loadAll();
        console.log('Modules lodaded');

        this.db = db; this.testing = testing;
    };

    async getRankCard (member) {

        try{

            const members = (await this.db.query(`SELECT * FROM members WHERE guild_id = ${member.guild.id}`)).rows
            const memberData = members.find(u => u.user_id === member.id)

            //Colours
            const colors = {
                bg: '#141414',
                highlight: '#ffffff',
                highlightDark: '#ababab',
                border: '#1c1c1c',
                main: memberData.rank_card_color ? memberData.rank_card_color : await this.config.colors.embed(member.guild)
            }

            registerFont('./Assets/Fonts/bahnschrift-main.ttf', {family: 'bahnschrift'})

            const canvas = createCanvas(640, 192)
            const ctx = canvas.getContext('2d')

            let rank = members.sort((a, b) => b.xp - a.xp).findIndex(u => u.user_id === member.id)+1;

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
            
            if (this.backgrounds.map(b => Number(b.id)).includes(memberData.rank_card_bg_id)) {

                const bg = this.backgrounds.find(bg => bg.id == memberData.rank_card_bg_id);
                let img = await loadImage(`./Assets/Backgrounds/${bg.file}`);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                


            } else {

                //Fill BG
                ctx.fillStyle = colors.bg
                ctx.fillRect(0, 0, canvas.width, canvas.height)

                ctx.drawImage(avatar, 180, -128, 512, 512)
                //Transparent bg colour
                colors.bga = Color(colors.bg).fade(1);
                let grd = ctx.createLinearGradient(180, 0, canvas.width+500, 0); grd.addColorStop(0, colors.bg); grd.addColorStop(1, colors.bga.rgb().string());

                ctx.fillStyle = grd; ctx.fillRect(0, 0, canvas.width, canvas.height);

                canvasRGBA(canvas, 0, 0, canvas.width, canvas.height, 15)

            }
            
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
            const level = this.functions.levelCalc(memberData.xp)
            
            //Bar constants
            const [barX, barY, barRad, barLen] = [192, 128, 16, 400]
            const minXP = this.functions.xpCalc(level);
            const maxXP = this.functions.xpCalc(level+1);
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
            const progStr = `${this.functions.groupDigits(currentXP)} / ${this.functions.groupDigits(maxXP - minXP)} xp`
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

            return canvas.toBuffer()

        } catch(e) {
            console.log(e)
        }

    };

    get backgrounds() {

        const dir = fs.readdirSync('./Assets/Backgrounds');

        let BGs = [];

        dir.forEach(f => {
            BGs.push({
                id: f.split('_')[0],
                name: f.split('_')[1].split('.')[0],
                file: f
            })
        });

        return BGs;

    };

    async _backgroundsImage() {

        const bgs = this.backgrounds;

        const canvas = createCanvas(2176, 64 + Math.ceil(bgs.length/3)*(192+150));
        const ctx = canvas.getContext('2d'); registerFont('./Assets/Fonts/bahnschrift-main.ttf', {family: 'bahnschrift'});
        ctx.fillStyle = '#36393E'; ctx.fillRect(0, 0, canvas.width, canvas.height)

        let [bg, img, text, xPos, yPos] = [];
        for (let i = 0; i < bgs.length; i++) {

            bg = bgs[i];

            xPos = 64 + (i % 3) * (640 + 64);
            yPos = 64 + Math.floor(i/3) * (192 + 150);
            text = `${bg.id}. ${bg.name.toUpperCase()}`

            img = await loadImage(`./Assets/Backgrounds/${bg.file}`);
            ctx.drawImage(img, xPos, yPos, 640, 192);

            ctx.font = 'bold 64px "bahnschrift"';
            ctx.textAlign = "center";
            ctx.fillStyle = '#fff'; ctx.strokeStyle = '#242424'; ctx.lineWidth = 12
            ctx.strokeText(text, xPos+320, yPos+192+64); ctx.fillText(text, xPos+320, yPos+192+64);

        }

        return {
            url: canvas.toBuffer()
        }

    };

    get backgroundsImage() {
        return this._backgroundsImage()
    };
    
};

const client = new BotClient();
client.config = {

    colors: {
        main: async (guild) => {
            const color = (await client.db.query(`SELECT main_color FROM guilds WHERE guild_id = ${guild.id}`)).rows[0].main_color;
            return color;
        },
        embed: async (guild) => {
            try{
                return JSON.parse((await client.db.query(`SELECT config FROM guilds WHERE guild_id = ${guild.id}`)).rows[0].config).messages.embeds.color
            } catch {
                return (await client.db.query(`SELECT main_color FROM guilds WHERE guild_id = ${guild.id}`)).rows[0].main_color;
            }
        },

        green: '#5CB85C',
        amber: '#F0AD4E',
        red: '#D9454F',

        discord: {
            blue: '#7289DA',
        },

        purple: '#'
    },

    presets: {
        blankField: {
            name: '\u200b',
            value: '\u200b'
        },
        blankFieldInline: {
            name: '\u200b',
            value: '\u200b',
            inline: true
        },
        defaultOptions: async (guild) =>  {
            return {

                footer: {
                    text: 'Type \'cancel\' to cancel.',
                },
                timestamp: Date.now(),
                color: await client.config.colors.embed(guild)
            }
        }
    },

    characters: {
        a: '🇦', b: '🇧', c: '🇨', d: '🇩',
        e: '🇪', f: '🇫', g: '🇬', h: '🇭',
        i: '🇮', j: '🇯', k: '🇰', l: '🇱',
        m: '🇲', n: '🇳', o: '🇴', p: '🇵',
        q: '🇶', r: '🇷', s: '🇸', t: '🇹',
        u: '🇺', v: '🇻', w: '🇼', x: '🇽',
        y: '🇾', z: '🇿', 0: '0⃣', 1: '1⃣',
        2: '2⃣', 3: '3⃣', 4: '4⃣', 5: '5⃣',
        6: '6⃣', 7: '7⃣', 8: '8⃣', 9: '9⃣',
        10: '🔟', '#': '#⃣', '*': '*⃣',
        '!': '❗', '?': '❓', '+': '➕',
        '-': '➖', '$': '💲', '>': '▶️',
        '<': '◀️', ' ': ' '
    },

}

client.functions = {

        pad: function pad(number, digits) {
            Number(number); Number(digits);
            if(number<0) return;
            let n = number;
            if(n === 0) {
                ++n;
            }
            let count = 0;
            if(n >= 1) ++count;
            while (n/10 >= 1) {
                n /= 10;
                ++count;
            }
            let diff;
            diff = digits - count;
            if (diff < 0 ) return number;
            let numArray = number.toString().split("");
            for (i = 0; i < diff; i++) {
    
                numArray.unshift('0');
            }
            return numArray.join('')
        },

        resolveMessage: async function resolveMessage(url) {
            try {
            let arr = url.match(/\d[\d\/]+/)[0].split('/');
                return await (await client.channels.fetch(arr[1])).messages.fetch(arr[2])
            } catch {
                return undefined
            }
        },

        UCT: function UCT(date = Date.now(), milliseconds = false) {
            let arr = []
            date = new Date(date)
            arr.push(client.functions.pad(date.getUTCHours(), 2));
            arr.push(client.functions.pad(date.getUTCMinutes(), 2));
            arr.push(client.functions.pad(date.getUTCSeconds(), 2));
            if(milliseconds === true) arr.push(client.functions.pad(date.getUTCMilliseconds(), 3))
            return arr.join(':')
        },

        xpCalc: function xpCalc(i) {
            return Math.floor(5 * Math.pow(135, 2) * ((Math.pow(10, 3) * Math.exp(-Math.pow(10, -3)* i) + i) - Math.pow(10, 3)))
        },

        levelCalc: function levelCalc(xp) {
            let level = 0;
            let n = 0;
            for(let i = 1; n <= xp; i++) {
                n = client.functions.xpCalc(i); level = i-1;
            };
            return level;
        },

        rng: function rng(min = 0, max = 1) {
            return Math.floor(Math.random() * ((1+max)-min)) + min
        },

        groupDigits: function groupDigits(n) {
            const arr = n.toString().split("").reverse();
            for(let i = 0; i < arr.length; i++) {
                if(Number.isInteger((i+1)/4)) {
                    arr.splice(i, 0, ",")
                }
            }
            return arr.reverse().join("")
        },

        toTitleCase: function toTitleCase(str) {

            str = str.trim(); let arr = str.split("");
            arr[0] = arr[0].toUpperCase();

            return arr.join("")
        },

        resolveHex: function resolveHex(input) {
            const Color = require('color');
            try {
                return Color(input.toLowerCase()).hex()
            } catch (e) {
                return undefined
            }
        },

        parseText: async function parseText(text, member) {
            const { xp } = (await client.db.query(`SELECT * FROM members WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)).rows[0];
            let level;
            if(text.includes('{level}')) {
                level = client.functions.levelCalc(xp)
            }
            
            return text
                .replace(/{member}/g, member)
                .replace(/{tag}/g, member.user.tag)
                .replace(/{guild}/g, member.guild.name)
                .replace(/{level}/g, level)
                .replace(/{xp}/g, xp);
        },
        
        since: function since(timestamp, max = 6) {
 
            const seconds = Math.round((new Date() - timestamp)/1000);
            let msgArray = [];
            let count = 0;
            
            let interval = Math.floor(seconds / (3600*24*30.4375*12))
            if(interval === 1 && count < max) {
                msgArray.push(`${interval} year`);
                ++count;
            } else if (interval > 1 && count < max) {
                msgArray.push(`${interval} years`);
                ++count;
            }
    
            const rMonths = seconds % (3600*24*30.4375*12);
            interval = Math.floor(rMonths / (3600*24*30.4375))
            if(interval === 1 && count < max) {
                msgArray.push(`${interval} month`);
                ++count;
            } else if (interval > 1 && count < max) {
                msgArray.push(`${interval} months`);
                ++count;
            }
    
            const rDays = seconds % (3600*24*30.4375);
            interval = Math.floor(rDays / (3600*24));
            if(interval === 1 && count < max) {
                msgArray.push(`${interval} day`);
                ++count;
            } else if (interval > 1 && count < max) {
                msgArray.push(`${interval} days`);
                ++count;
            }
    
            const rHours = seconds % 3600*24;
            interval = Math.floor(rHours / 3600);
            if(interval === 1 && count < max) {
                msgArray.push(`${interval} hour`);
                ++count;
            } else if (interval > 1 && count < max) {
                msgArray.push(`${interval} hours`);
                ++count;
            }
    
            const rMinutes = seconds % 3600;
            interval = Math.floor(rMinutes / 60);
            if(interval === 1 && count < max) {
                msgArray.push(`${interval} minute`);
                ++count;
            } else if (interval > 1 && count < max) {
                msgArray.push(`${interval} minutes`);
                ++count;
            }
    
            const rSeconds = seconds % 60
            interval = Math.floor(rSeconds);
            if(interval === 1 && count < max) {
                msgArray.push(`${interval} second`);
                ++count;
            } else if (interval > 1 && count < max) {
                msgArray.push(`${interval} seconds`);
                ++count;
            }
    
            return msgArray.join(', ')
        },
        
        compareArray: function compareArray(a, b) {
            let valid = true
            if(a.length !== b.length) {
                valid = false
            } else {
                for(i = 0; i < a.length; i++) {
                    valid = a[i] === b[i] ? valid : false
                }
            }
            return valid;
        },

        optionEmbed: function optionEmbed(options, defaultOptions) {
            
            embed = {
                title: 'CHOOSE AN OPTION',
                description: options.map(e => `\`${options.indexOf(e)+1}\` • \`${e[0]}\``).join("\n"),
            };

            Object.assign(embed, defaultOptions)

            return embed;
        },

        prompt: function prompt(embed, retries = 5, time = 60*1000) {

            return {
                start: () => {
                    return { embed: embed };
                },
                retry: () => {
                    return { embed: embed };
                },
                cancel: () => {
                    return { embed: {
                        title: 'COMMAND CANCELLED',
                        description: '`Cancelled by User.`',
                        timestamp: Date.now(),
                        color: client.config.colors.red
                    }};
                },
                ended: () => {
                    return { embed: {
                        title: 'COMMAND CANCELLED',
                        description: 'Invalid Input.\n`Retry limit exceeded.`',
                        timestamp: Date.now(),
                        color: client.config.colors.red
                    }};
                },
                timeout: () => {
                    return { embed: {
                        title: 'COMMAND CANCELLED',
                        description: `Timed Out.\n\`[${client.functions.UCT()}]\``,
                        timestamp: Date.now(),
                        color: client.config.colors.red
                    }};
                },
                retries: retries,
                time: time,
            }
        },

        helpPrompt: function helpPrompt(message, command) {
            return {
                start: () => {
                    client.emit('help', message, command);
                },
                retry: () => {
                    client.emit('help', message, command);
                }
            }
        }
}

client.login(credentials.TOKEN)