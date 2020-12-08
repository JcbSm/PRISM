const { Listener } = require('discord-akairo');

class AddMemberListener extends Listener {
    constructor() {
        super('addMember', {
            emitter: 'client',
            event: 'addMember'
        });
    };

    async exec(userID, guildID) {

        const DB = this.client.db;

        if(!(await DB.query(`SELECT user_id FROM users WHERE user_id = ${userID}`)).rows[0]) {
            await DB.query(`INSERT INTO users (user_id) VALUES (${userID});`);
            console.log(`Added to users with user_id ${userID}`)
        }

        await DB.query(`INSERT INTO members (user_id, guild_id) VALUES (${userID}, ${guildID});`, (err, res) => {
            if(err) return console.log(err)
            console.log(`Added to members with user_id ${userID} and guild_id ${guildID}`)
        })

        this.client.emit('xp-levelUp', await (await this.client.guilds.fetch(guildID)).members.fetch(userID), 0, false)
    };
};

module.exports = AddMemberListener;