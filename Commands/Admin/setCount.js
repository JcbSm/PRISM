const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'setcount',
    aliases: [],
    description: {
        usage: ['[number]'],
        content: 'Set the server\'s count\n**WARNING:** CANNOT BE UNDONE'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['MANAGE_MESSAGES', 'SEND_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
}, __dirname)

class SetCoundCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args(message) {

        const count = yield {

            type: 'integer',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this);
                }
            }
        };

        if(count < 0 || !count) return message.reply('Invalid argument.')

        let confirm = yield {

            type: [
                ['YES', 'Y'],
                ['NO', 'N']
            ],
            prompt: {
                start: { embed: {
                    title: 'CONFIRM',
                    description: `Are you sure you want to set **COUNT** to \`${count}\`? (Y/N)\n**WARNING:** CANNOT BE UNDONE`,
                    color: this.client.config.colors.discord.blue
                }}
            },
            match: 'none'
        }

        confirm = confirm === 'YES' ? true : confirm === 'NO' ? false : null

        return { count, confirm }
    };

    async exec(message, args) {

        if(args.confirm) {

            let client = this.client;

            client.db.query(`SELECT counting_count, counting_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`, (err, res) => {
                if(err) return;
                if(args.count > res.rows[0].counting_count) return message.reply('You can\'t set count to a higher value than it is.');
                
                const ratio = Math.ceil(res.rows[0].counting_count/args.count);

                let channel = message.guild.channels.cache.get(res.rows[0].counting_channel_id)
                client.db.query(`UPDATE guilds SET counting_count = ${args.count} WHERE guild_id = ${message.guild.id}`, (err, res) => {
                    if(err) return;
                    channel.send(args.count)
                    message.channel.send({ embed: {
                        description: `✅ Set **COUNT** to \`${args.count}\` in **${message.guild.name}**`,
                        color: this.client.config.colors.green,
                        timestamp: Date.now()
                    }})
                });

                // client.db.query(`UPDATE members SET counting_counts = counting_counts/${ratio} WHERE guild_id = ${message.guild.id}`, (err, res) => {
                //     console.log(err, res)
                // })
            });
        
        } else {

            message.channel.send({ embed: {
                description: `❌ Cancelled`,
                color: this.client.config.colors.red,
                timestamp: Date.now()
            }});

        };
    };
};

module.exports = SetCoundCommand;