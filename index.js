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
        }

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
    console.log('Connecting to DB');
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
        });

        this.commandHandler = new CommandHandler(this, {
                directory: './Commands/',
                prefix: async message => {
                    if(testing) return 't;'
                    try{
                        return (await db.query(`SELECT prefix FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].prefix;
                    } catch(err) {
                        console.log(err)
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
    };
};

const client = new BotClient();

client.db = db;
client.testing = testing;
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
            }
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
            let arr = url.match(/\d[\d\/]+/)[0].split('/');
            return await (await client.channels.fetch(arr[1])).messages.fetch(arr[2])
        },

        UCT: function UCT(date = Date.now(), milliseconds = false) {
            let arr = []
            date = new Date(date)
            arr.push(this.pad(date.getUTCHours(), 2));
            arr.push(this.pad(date.getUTCMinutes(), 2));
            arr.push(this.pad(date.getUTCSeconds(), 2));
            if(milliseconds === true) arr.push(this.pad(date.getUTCMilliseconds(), 3))
            return arr.join(':')
        },

        xpCalc: function xpCalc(i) {
            return Math.floor(5 * Math.pow(135, 2) * ((Math.pow(10, 3) * Math.exp(-Math.pow(10, -3)* i) + i) - Math.pow(10, 3)))
        },

        levelCalc: function levelCalc(xp) {
            let level = 0;
            let n = 0;
            for(let i = 1; n <= xp; i++) {
                n = this.xpCalc(i); level = i-1;
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
                return Color(input).hex()
            } catch (e) {
                return undefined
            }
        },

        parseText: async function parseText(text, member) {
            const { xp } = (await client.db.query(`SELECT * FROM members WHERE user_id = ${member.id} AND guild_id = ${member.guild.id}`)).rows[0];
            let level;
            if(text.includes('{level}')) {
                level = this.levelCalc(xp)
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
}

client.login(credentials.TOKEN)