const { Listener } = require('discord-akairo');

class MissingPermissionsListener extends Listener {
    constructor() {
        super('missingPermissions', {
            emitter: 'commandHandler',
            event: 'missingPermissions'
        });
    }

    async exec(message, command, type, missing) {
        
        if(type === 'user') {

            message.reply({ embed: {
                //title: 'MISSING PERMISSION',
                description: `${message.member}, you do not have permission to run this command.`,
                color: this.client.config.colors.red
            }});

            this.client.emit('log-missingPermissions', message, command, missing)

        } else if (type === 'client') {

            message.channel.send( {embed: {
                title: 'BOT MISSING PERMISSIONS',
                description: `I do not have the required permissions to run this command`,
                fields: [
                    {
                        name: 'PERMISSIONS',
                        value: missing.map(m => `\`${m}\``).join('\n')
                    }
                ],
                color: this.client.config.colors.red
            }});

        };
    };
};

module.exports = MissingPermissionsListener;