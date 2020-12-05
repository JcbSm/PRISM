const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'muterole',
    aliases: ['mutedrole', 'mr'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[role]', '(create | remove | view)'],
        content: 'Set the role which will be given to members when they are muted',
        argumentOptions: [
            {
                id: 'role',
                options: [
                    ['[ROLE]'],
                    ['CREATE'],
                    ['REMOVE'],
                    ['VIEW']
                ]
            }
        ]
    },

    clientPermissions: ['SEND_MESSAGES', 'MANAGE_ROLES'],
    userPermissions: ['MANAGE_ROLES', 'MUTE_MEMBERS']
}, __dirname);

class MuteRoleCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        const manage = yield {

            type: [
                ['CREATE'],
                ['REMOVE', 'RM'],
                ['VIEW']
            ],
            unordered: true,
            match: 'content'
        };

        let [role, confirm] = [];
        if(!manage) {

            role = yield {

                type: 'role',
                unordered: true,
                match: 'content',
                prompt: {
                    start: message => {
                        this.client.emit('help', message, this);
                    },
                    retry: message => {
                        this.client.emit('help', message, this)
                    }
                }
            };

        } else if(manage !== 'VIEW') {

            let currentRoldId = (await this.client.db.query(`SELECT mute_role_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].mute_role_id;

            if(currentRoldId) {

                confirm = yield {

                    match: 'none',
                    type: [
                        ['YES', 'Y'],
                        ['NO', 'N']
                    ],
                    prompt: {
                        start: { embed: {
                            description: `Do you want to delete the old role from the server? **(Y/N)**`,
                            fields: [
                                {
                                    name: 'ROLE',
                                    value: `<@&${currentRoldId}>` 
                                }
                            ],
                            color: this.client.config.colors.discord.blue
                        }}
                    },
                };

                confirm = confirm === 'YES' ? true : confirm === 'NO' ? false : null
            };
        };

        return { role, manage, confirm }
    };

    async exec(message, args) {

        let oldRoleID = (await this.client.db.query(`SELECT mute_role_id FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].mute_role_id;
        let embed;
        
        if(args.manage) {

            if(args.manage === 'CREATE') {

                const newRole = await message.guild.roles.create({data: {
                    name: 'Muted',
                    color: 'DEFAULT',
                }, reason: 'New mute role'});
                
                await this.client.db.query(`UPDATE guilds SET mute_role_id = ${newRole.id} WHERE guild_id = ${message.guild.id}`);

                embed = {
                    description: `✅ Created ${newRole}.`,
                    color: this.client.config.colors.green,
                    timestamp: Date.now()
                }

                if(oldRoleID && args.confirm) {

                    const oldRole = await message.guild.roles.fetch(oldRoleID);
                    embed.description = `✅ Created ${newRole} and deleted \`${oldRole.name}\`.`,
                    await oldRole.delete();

                }

            } else if(args.manage === 'REMOVE') {

                if(oldRoleID) {

                    await this.client.db.query(`UPDATE guilds SET mute_role_id = null WHERE guild_id = ${message.guild.id}`);

                    embed = {
                        description: `✅ Unassigned <@&${oldRoleID}>.`,
                        color: this.client.config.colors.green,
                        timestamp: Date.now()
                    }

                    if(args.confirm) {

                        let role = await message.guild.roles.fetch(oldRoleID);
                        embed.description = `✅ Unassigned and deleted \`${role.name}\`.`
                        await role.delete();
                    }

                } else {

                    message.channel.send('No role ID to remove.')

                }

            } else if(args.manage === 'VIEW') {

                if(oldRoleID) {

                    embed = {
                        title: 'CURRENT MUTE ROLE',
                        description: `<@&${oldRoleID}>`,
                        color: this.client.config.colors.discord.blue,
                        timestamp: Date.now()
                    }

                } else {

                    message.channel.send('No role assigned.')
                }

            }

            message.channel.send({embed: embed})

        } else if(args.role) {

            if(args.role.id === oldRoleID) return message.channel.send({ embed: { description: 'No changes were made' }})
            await this.client.db.query(`UPDATE guilds SET mute_role_id = ${args.role.id} WHERE guild_id = ${message.guild.id}`);

            oldRoleID = oldRoleID ? `<@&${oldRoleID}>` : '`null`'

            message.channel.send({ embed: {
                title: 'MUTE ROLE UPDATED',
                description: `Successfully updated mute role for **${message.guild.name}**`,
                fields: [
                    {
                        name: 'OLD ROLE',
                        value: oldRoleID
                    },
                    {
                        name: 'NEW ROLE',
                        value: `<@&${args.role.id}>`
                    }
                ],
                color: this.client.config.colors.green,
                timestamp: Date.now()
            }})

        } else {

            this.client.emit('help', message, this)
        };
    };
};

module.exports = MuteRoleCommand;