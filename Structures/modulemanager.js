class ModuleManager {

    constructor(client, guildID, data) {

        Object.defineProperties(this, {
            client: { value: client },
            guildID: { value: guildID }
        });

        this.modules = [];

        

    };
};

module.exports = ModuleManager;