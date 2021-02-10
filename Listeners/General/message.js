const { Listener } = require('discord-akairo');

class MessageListener extends Listener {
    constructor() {
        super('message', {
            emitter: 'client',
            event: 'message'

        });
    };

    async exec(message) {

        if(message.partial) message = await message.fetch();

        if(message.channel.type === 'text') {

            if(message.author.id === '746375711773687909') {
                message.reply('lol ok')
            }

            if(!(await this.client.db.query(`SELECT guild_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0]) {
                this.client.emit('guildCreate', message.guild)
            };

            if(!(await this.client.db.query(`SELECT user_id FROM members WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)).rows[0] && !message.author.bot) {
                this.client.emit('addMember', message.member.id, message.guild.id)
            } else if(!message.author.bot) {
                this.client.emit('xp-message', message)
                this.client.emit('stats-message', message)
            };

            const guildData = (await this.client.db.query(`SELECT * FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0];

            switch(message.channel.id) {
                case guildData.counting_channel_id:
                    this.client.emit('count', message);
            };
            
            if(!message.author.bot && message.channel.id !== guildData.counting_channel_id) {

                //Auto Responder
                const responses = (await this.client.db.query(`SELECT * FROM responder WHERE guild_id = ${message.guild.id}`)).rows;

                for(let {regex, text_response, reaction_response, match_content} of responses) {
                    
                    regex = regex.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\./g, '\\.').replace(/\^/g, '\\^').replace(/\$/g, '\\$').replace(/\:/g, '\\:').replace(/\//g, '\\/')
                    regex = match_content ? new RegExp(`^${regex}$`, 'i') : new RegExp(`${regex}`, 'i');
                    
                    if(regex.test(message.content)) {
                        text_response ? message.channel.send(await this.client.functions.parseText(text_response, message.member)) : null
                        reaction_response ? message.react(reaction_response) : null
                    };
                };
            };

            const config = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].config);
            
            if(config.messages.wordFilter.any.length > 0 || config.messages.wordFilter.exact.length > 0) {

                for(let word of config.messages.wordFilter.exact) {

                    if(message.content.replace(/1/g, 'i') === word) message.delete();

                }

                for(let word of config.messages.wordFilter.any) {

                    if(message.content.replace(/1/g, 'i').toLowerCase().includes(word)) message.delete();

                }

            };
        };
    };
};

module.exports = MessageListener;