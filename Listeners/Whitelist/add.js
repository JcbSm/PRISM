const { Listener } = require('discord-akairo');

class WhitelistAddListener extends Listener {
    constructor() {
        super('whitelist-add', {
            emitter: 'client',
            event: 'whitelist-add'
        });
    };

    async exec(message) {

        const username = message.content;

        if (!/^([a-z]|[0-9]|\_){3,16}$/gi.test(username)) return message.delete();

        const { mc_username, mc_username_url } = (await this.client.db.query(`SELECT mc_username, mc_username_url FROM members WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)).rows[0];

        if (mc_username) {
            if (mc_username.toLowerCase() === username.toLowerCase()) return message.delete();
        };

        if (mc_username_url) {
            let old = await this.client.functions.resolveMessage(mc_username_url);
            if (old) old.delete();
        }

        await this.client.db.query(`UPDATE members SET mc_username = '${username}', mc_username_url = '${message.url}' WHERE user_id = ${message.author.id} AND guild_id = ${message.guild.id}`)

        const serverConsole = message.guild.channels.cache.find(c => c.type == "text" && c.name == "server-console");

        if (serverConsole) {

            serverConsole.send(`whitelist add ${username}`);
            if (mc_username) serverConsole.send(`whitelist remove ${mc_username}`);

            let sent;
            if (mc_username === null) {
                sent = await message.channel.send(`Added \`${username}\` to the whitelist.`)
            } else {
                sent = await message.channel.send(`Added \`${username}\` to the whitelist.\nRemoved \`${mc_username}\`.`)
            };
            setTimeout(() => sent.delete(), 7500)

        } else {
            message.reply('No server console found.')
        }

    };
};

module.exports = WhitelistAddListener;