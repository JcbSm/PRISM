const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');
const Color = require('color');
const { uniqueId } = require('lodash');

class DebugCommand extends Command {
    constructor() {
        super('debug', {
            aliases: ['debug', 'test'],
            clientPermissions: [],
            args: [
                {
                    id: 'str'
                }
            ]
        });
    };

    async exec(message, args) {

        const guild = await this.client.guilds.fetch('447504770719154192')
        
        const oldData = (await this.client.db.query(`SELECT * FROM tbl_users`)).rows;
        const currentData = (await this.client.db.query(`SELECT * FROM members WHERE guild_id = ${guild.id}`)).rows;

        let i = 0;
        for(const entry of oldData) {
            i++
            if(!currentData.map(u => u.user_id).includes(entry.user_id)) {

                this.client.emit('addMember', entry.user_id, guild.id)
                
            } else {
            
                await this.client.db.query(`UPDATE members SET
                    messages = ${entry.total_messages},
                    voice_minutes = ${entry.total_voice_minutes},
                    mute_minutes = ${entry.total_mute_minutes},
                    afk_count = ${entry.afk_count},
                    xp = ${entry.xp},
                    xp_messages = ${entry.messages},
                    xp_minutes = ${entry.voice_minutes},
                    xp_last_message_timestamp = ${entry.last_message_timestamp}

                WHERE user_id = ${entry.user_id} AND guild_id = 447504770719154192`, (err, res) => err ? console.log(err) : '')

            }
            console.log(i)
        }
    };
};

module.exports = DebugCommand;