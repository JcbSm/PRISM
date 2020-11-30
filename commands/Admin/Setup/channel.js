const { Command } = require('discord-akairo');

class ChannelCommand extends Command {
    constructor() {
        super('channel', {
            aliases: ['channel', 'setchannel', 'channels'],
            description: {
            },
            category: 'administration',
            channel: 'guild',
            args: [
                {
                    id: 'option',
                    type: async (message, phrase) => {
                        const IDs = (await this.client.db.query(`SELECT logs_channel_id, counting_channel_id, wording_channel_id, calls_channel_id, levels_channel_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0];
                
                        let options = [
                            ['VIEW']
                        ];
                        Object.entries(IDs).forEach(element => {
                            options.push([element[0].replace(/_channel_id/, '').toUpperCase()]);
                        });
                
                        for (const entry of options) {
                            if (entry.some(t => t === phrase.toUpperCase())) {
                                return entry[0];
                            };
                        };
                
                        return null;
                    },
                    default: 'VIEW'
                },
                {
                    id: 'channel',
                    type: 'channel',
                    match: 'rest'
                }
            ],
            userPermissions: ['ADMINISTRATOR']
        });
    };

    async exec(message, args) {
        try{
            console.log(args.option)

        const val = args.channel ? args.channel.id : null

        function validateChannel(channel, type) {
            if(channel.type !== type) { return true; } else { return false; }
        };

        switch(args.option) {

            case 'VIEW':

                const IDs = (await this.client.db.query(`SELECT
                    logs_channel_id, counting_channel_id,
                    wording_channel_id, calls_channel_id,
                    levels_channel_id
                    FROM guilds WHERE guild_id = ${message.guild.id}
                `)).rows[0];
    
                let fields = [];
                Object.entries(IDs).forEach(element => {
                    let name = element[0].replace(/_channel_id/, '').toUpperCase();
                    element[1] ? fields.push({name: name, value: `<#${element[1]}>`}) : fields.push({name: name, value: `\`${element[1]}\``})
                })
                
                message.channel.send({ embed: {
                    title: `${message.guild.name} CHANNELS`,
                    fields: fields,
                    color: this.client.config.colors.discord.blue
                }});
                break;
            case 'LOGS':
                if(args.channel){
                    if(validateChannel(args.channel, 'text')) return message.reply('Invalid channel type.')
                };
                await this.client.db.query(`UPDATE guilds SET logs_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            case 'COUNTING':
                if(args.channel) {
                    if(validateChannel(args.channel, 'text')) return message.reply('Invalid channel type.')
                };
                await this.client.db.query(`UPDATE guilds SET counting_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                if(val) {
                    args.channel.send((await this.client.db.query(`SELECT counting_count FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].counting_count)
                }
                break;
            case 'WORDING':
                if(args.channel) {
                    if(validateChannel(args.channel, 'text')) return message.reply('Invalid channel type.');
                };
                await this.client.db.query(`UPDATE guilds SET wording_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            case 'CALLS':
                if(args.channel) {
                    if(validateChannel(args.channel, 'category')) return message.reply('Invalid channel type.');
                };
                await this.client.db.query(`UPDATE guilds SET calls_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            case 'LEVELS':
                if(args.channel) {
                    if(validateChannel(args.channel, 'text')) return message.reply('Invalid channel type.');
                };
                await this.client.db.query(`UPDATE guilds SET levels_channel_id = ${val} WHERE guild_id = ${message.guild.id}`);
                break;
            default:
                return message.reply('Unknown option')
        };

        if(args.option.toLowerCase() !== 'view') {
            message.channel.send({ embed: {
                description: `Set **${args.option.toUpperCase()}** channel to ${args.channel}`,
                color: this.client.config.colors.discord.blue
            }});  
        }
    }catch(e) {console.log(e)}
    };
};

module.exports = ChannelCommand;