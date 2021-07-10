class ModuleManager {

    constructor(client, guildID) {

        Object.defineProperties(this, {
            client: { value: client },
            guildID: { value: guildID }
        });

        this.modules = (await client.db.query(`SELECT enabled_modules FROM guilds WHERE guild_id = ${guildID}`)).rows[0].enabled_modules;
        
        console.log(this.modules);

    };
};

module.exports = ModuleManager;