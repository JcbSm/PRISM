const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'mute',
    aliases: [],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[member] (reason)', '[member] (time) (reason)'],
        content: 'Mutes a member',
        
    },
    clientPermissions: ['MUTE_MEMBERS', 'MANAGE_ROLES'],
    userPermissions: ['MUTE_MEMBERS', 'MANAGE_ROLES'],
}, __dirname);

class MuteCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async *args(message) {

        let { mute_role_id, config } = (await this.client.db.query(`SELECT mute_role_id, config FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0];
        if(!mute_role_id) {return this.client.emit('help', message, this.handler.modules.get('muterole'))}
        config = JSON.parse(config)

        const member = yield {

            type: 'member',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this);
                }
            }
        };

        let reason = yield {

            match: 'rest',
            unordered: true
        }
        
        if(reason) {
            let reg = /\d{1,3}(d|h|m)\s*/gi;
            reason = reason.replace(reg, '');
        }
        reason = reason ? reason : '`null`'

        let time = yield {

            type: /(\d{1,3}(d|h|m))+/mig,
            match: 'content',
            unordered: true
        };

        function parseTime(arr) {
            let [obj, n, i] = [{ d: 0, h: 0, m: 0 }, 0, 0]
            for(let str of arr) {
                n = Number(str.replace(/\D/gi, ''));
                i = str.replace(/[^dhm]/gi, '').toLowerCase();

                obj[i] += n;
            }
            return obj;
        }

        time = time ? parseTime(time.match) : null;

        let timeStr;
        if(time) {
            timeStr = Object.entries(time).map(e => e[1]+e[0]).join(', ')
        } else {
            timeStr = 'null'
        }

        let confirm = yield {

            match: 'none',
            type: [
                ['YES', 'Y'],
                ['NO', 'N']
            ],
            prompt: {
                start: { embed: {
                    title: 'CONFIRM',
                    description: `Are you sure you want to mute ${member}? **(Y/N)**`,
                    fields: [
                        {
                            name: 'REASON',
                            value: reason 
                        },
                        {
                            name: 'TIME',
                            value: `\`${timeStr}\``
                        }
                    ],
                    color: this.client.config.colors.discord.blue
                }}
            },
        };
        
        confirm = confirm === 'YES' ? true : confirm === 'NO' ? false : null
        
        return { member, time, reason, confirm, mute_role_id, config }

    };

    async exec(message, args) {

        if(!args.mute_role_id) return;

        let timeStr;
        if(args.time) {
            timeStr = Object.entries(args.time).map(e => e[1]+e[0]).join(', ')
        } else {
            timeStr = 'undefined'
        }

        if(args.confirm) {

            let milli = 0
            
            if(args.time) {

                milli = args.time.m*1000*60 + args.time.h*1000*60*60 + args.time.d*1000*60*60*24;

                await this.client.db.query(`UPDATE members SET temp_mute = ${Date.now() + milli} WHERE user_id = ${args.member.id} AND guild_id = ${message.guild.id}`);

                this.client.emit('mod-tempmute', args.member);
            };

            args.member.roles.add(args.mute_role_id)

            args.member.user.send({ embed: {
                title: 'WARNING',
                description: await this.client.functions.parseText(args.config.messages.warnings.mute, args.member),
                fields: [
                    {
                        name: 'REASON',
                        value: args.reason,
                    },
                    {
                        name: 'DURATION',
                        value: `\`${timeStr}\``,
                    }
                ],
                timestamp: Date.now(),
                color: this.client.config.colors.red
            }});

            message.channel.send({ embed: {

                title: 'MEMBER MUTED',
                description: `✅ ${args.member} has been muted.`,
                fields: [
                    {
                        name: 'REASON',
                        value: args.reason
                    },
                    {
                        name: 'DURATION',
                        value: `\`${timeStr}\``
                    }
                ],
                color: this.client.config.colors.green,
                timestamp: Date.now() + milli
            }});

        } else {

            message.channel.send({ embed: {

                description: `❌ ${args.member} was not muted.`,
                color: this.client.config.colors.red,
                timestamp: Date.now()
            }})

        }
    };
};

module.exports = MuteCommand;

