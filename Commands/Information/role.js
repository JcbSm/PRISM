const { Command, TypeResolver } = require('discord-akairo');
const { commandOptions } = require('../../index');
const moment = require('moment');

const commandInfo = commandOptions({
    id: 'role',
    aliases: [ 'roleinfo' ],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['[role]', '[role] (page)'],
        content: 'View role info and a member list for that role.',
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []
}, __dirname);

class RoleInfoCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args () {

        const role = yield {
            type: 'role',
            prompt: {
                start: message => {
                    this.client.emit('help', message, this);
                },
                retry: message => {
                    this.client.emit('help', message, this);
                }
            }
        };

        const page = yield {
            default: 1,
            type: 'integer'
        }

        return { role, page };

    };

    async exec(message, args) {


        let [role, members] = [ args.role, (await message.guild.members.fetch()).filter(m => m.roles.cache.has(args.role.id)).sort((a,b) => a.joinedTimestamp - b.joinedTimestamp) ];
        let [start, end, arr, memIDs] = [(args.page-1)*10, (args.page*10)-1, [], members.keyArray()];
        members = [...members];

        end = end >= members.length ? members.length - 1 : end
        for(let i = start; i <= end; i++) {
            arr.push(members[i][0])
        }

        let embed = {
            title: 'ROLE INFORMATION',
            description: `${role}`,
            fields: [
                {
                    name: 'COLOR',
                    value: `\`${role.hexColor}\``,
                    inline: true
                },
                {
                    name: 'CREATED',
                    value: `\`${new moment(role.createdAt).format('DD MMM YYYY')}\``,
                    inline: true,
                },
                {
                    name: 'AGE',
                    value: `\`${this.client.functions.since(role.createdTimestamp, 3)}\``,
                    inline: true
                },
                {
                    name: 'POSITION',
                    value: `\`${role.rawPosition}\``,
                    inline: true,
                },
                {
                    name: 'MENTIONABLE',
                    value: `\`${role.mentionable}\``,
                    inline: true
                },
                {
                    name: 'ID',
                    value: `\`${role.id}\``,
                    inline: true
                },
                {
                    name: 'PERMISSIONS',
                    value: role.permissions.toArray().map(e => `\`${e}\``).join("\n"),
                    inline: true,
                },
                {
                    name: 'MEMBERS',
                    value: arr.length !== 0 ? `${arr.map(e => `\`${this.client.functions.pad(memIDs.indexOf(e)+1, 2)}.\` • <@${e}>`).join("\n")}\n\nPage ${args.page} | ${start+1} - ${end+1} of ${members.length}` : '`No more members`',
                    inline: true
                }
            ],
            color: role.color === 0 ? await this.client.config.colors.embed(message.guild) : role.color
        };

        message.channel.send({ embed: embed })
    };
};

module.exports = RoleInfoCommand;