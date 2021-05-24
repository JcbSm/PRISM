const { Command } = require('discord-akairo');
const { GuildChannel } = require('discord.js');
const { commandOptions } = require('../../index');
//const _ = require('lodash')

class UpdateConfigCommand extends Command {
    constructor() {
        super('updateconfig', {
            aliases: ['updateconfig'],
            ownerOnly: true
        });
    };

    async exec(message, args) {
        
        let guilds = (await this.client.db.query(`SELECT config, guild_id FROM guilds`)).rows;
        let configFile = require('./Settings/config.json');

        this.client.db.query(`ALTER TABLE guilds ALTER COLUMN config SET DEFAULT '${JSON.stringify(configFile)}'`)
        
        for(let guild of guilds) {

            let config = configFile;
            let guildConfig = JSON.parse(guild.config);

            let newConfig = _.merge(config, guildConfig)

            await this.client.db.query(`UPDATE guilds SET config = '${JSON.stringify(newConfig)}' WHERE guild_id = ${guild.guild_id}`)
            console.log(`Updated config for ${guild.guild_id}`)

        }

        message.reply('Done')

    };
};

//module.exports = UpdateConfigCommand;