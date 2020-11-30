console.log('Initialising');
const { AkairoClient, CommandHandler, ListenerHandler, InhibitorHandler, Command } = require('discord-akairo');
const { Client } = require('pg');
const { ownerID } = require('./config')

let credentials;
try{
    credentials = require('./credentials.json');
} catch {
    credentials = process.env
}

const db = new Client({
    connectionString: credentials.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

(async function() {
    console.log('Connecting to DB');
    try{
        await db.connect();
        console.log('Connection established');
    } catch (error) {
        console.log(error);
    };
}());

class BotClient extends AkairoClient {
    constructor() {
        super({
            ownerID: ownerID,
        }, {
            disableEveryone: true,
            allowMention: true,
        });

        this.commandHandler = new CommandHandler(this, {
                directory: './commands/',
                prefix: async message => {
                    try{
                        return (await db.query(`SELECT prefix FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].prefix;
                    } catch {
                        return ';'
                    }
                },
                commandUtil: true
            }
        );
        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: './inhibitors/'
        });

        this.listenerHandler = new ListenerHandler(this, {
            directory: './listeners/'
        });

        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        
        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler,
            inhibitorHandler: this.inhibitorHandler,
            listenerHandler: this.listenerHandler
        });
        
        console.log('Loading Modules...');
        this.commandHandler.loadAll();
        this.listenerHandler.loadAll();
        this.inhibitorHandler.loadAll();
        console.log('Modules lodaded');
    };
};

const client = new BotClient();

client.db = db;
client.config = require('./config');
client.functions = client.config.functions

client.login(credentials.TOKEN)