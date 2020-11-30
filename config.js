module.exports = {

    ownerID: '227848397447626752',

    colors: {
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

    functions: {

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

        resolveMessage: async function resolveMessage(url, client) {
            let arr = url.match(/\d[\d\/]+/)[0].split('/');
            return await (await client.channels.fetch(arr[1])).messages.fetch(arr[2])
        },

        UCT: function UCT(date = Date.now(), milliseconds = false) {
            let arr = []
            date = new Date(date)
            arr.push(module.exports.functions.pad(date.getUTCHours(), 2));
            arr.push(module.exports.functions.pad(date.getUTCMinutes(), 2));
            arr.push(module.exports.functions.pad(date.getUTCSeconds(), 2));
            if(milliseconds === true) arr.push(module.exports.functions.pad(date.getUTCMilliseconds(), 3))
            return arr.join(':')
        },

        xpCalc: function xpCalc(i) {
            return Math.floor(5 * Math.pow(135, 2) * ((Math.pow(10, 3) * Math.exp(-Math.pow(10, -3)* i) + i) - Math.pow(10, 3)))
        },

        levelCalc: function levelCalc(xp) {
            let level = 0;
            let n = 0;
            for(let i = 1; n <= xp; i++) {
                n = module.exports.functions.xpCalc(i); level = i-1;
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
        }
    }
}