const { Listener } = require('discord-akairo');

class AddMemberListener extends Listener {
    constructor() {
        super('addMember', {
            emitter: 'client',
            event: 'addMember'
        });
    };

    async exec(member) {

        const DB = this.client.db;

        if(!(await DB.query(`SELECT user_id FROM users WHERE user_id = ${member.id}`)).rows[0]) {
            await DB.query(`INSERT INTO users (user_id) VALUES (${member.id});`);
            console.log(`Added ${member.user.tag} to users with user_id ${member.id}`)
        }

        DB.query(`INSERT INTO members (user_id, guild_id) VALUES (${member.id}, ${member.guild.id});`, (err, res) => {
            if(err) return console.log(err)
            console.log(`Added ${member.user.tag} to members with user_id ${member.id} and guild_id ${member.guild.id}`)
        })
    };
};

module.exports = AddMemberListener;