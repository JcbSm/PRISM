const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'poll',
    aliases: [],
    channel: null,
    typing: true,
    description: {
        usage: ['question; option 1; option 2; option 3...'],
        content: 'Creates a poll with reactions',
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: [],
}, __dirname);

class PollCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args(message) {
try{
        const phrases = message.util.parsed.content.split(';');

        let [phrase, question, options] = [,,[]]
        for(let i = 0; i < phrases.length; i++) {
            phrase = phrases[i].trim();
            if(phrase === '') continue;
            i === 0 ? question = phrase : options.push([Object.values(this.client.config.characters).slice(11)[i-1], phrase]);
        }

        return { question, options }
    }catch(e) {console.log(e)}
    };

    async exec(message, args) {

        if(!args.question) return 'Please provide a question';
        if(args.options.length < 2 || args.options.length > 20) return message.reply('Please provide 2-20 options.');

        message.delete();

        let sent = await message.channel.send(`${message.member} asks:`, { embed: {
            title: `*${args.question}*`,
            description: `\u200b\n${args.options.map(o => o.join(' - ')).join('\n')}`,
            thumbnail: {
                url: message.author.displayAvatarURL()
            },
            footer: {
                text: message.author.tag
            },
            timestamp: Date.now(),
            color: await this.client.config.colors.embed(message.guild)

        }});

        for (let i = 0; i < args.options.length; i++) {
            await sent.react(Object.values(this.client.config.characters).slice(11)[i])
        }

    };
};

module.exports = PollCommand;