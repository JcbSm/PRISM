const { Command } = require('discord-akairo');
const { commandOptions } = require('../../index');

const commandInfo = commandOptions({
    id: 'responder',
    aliases: ['response', 'autoresponder'],
    channel: 'guild',
    typing: false,
    description: {
        usage: ['add;', 'remove;', 'view; (page)'],
        content: 'Add or remove responses to messages',
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
    separator: ';'
}, __dirname);

class ResponderCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    async * args(message) {

        const { prompt } = this.client.functions;

        let [ embed, match, type, id, page, confirm, response, blacklist, whitelist ] = [ 
            null, null, null, null, null, null, { text: null, emoji: null }, { roles: [], channels: [] }, { roles: [], channels: [] }
        ];

        let globalEmbedOptions = {

            footer: {
                text: 'Type \'cancel\' to cancel.',
            },
            timestamp: Date.now(),
            color: await this.client.config.colors.embed(message.guild)
        };

        let options = [
            ['ADD'],
            ['REMOVE', 'RM'],
            ['VIEW']
        ];

        const opt = yield {

            type: options,
            prompt: {
                start: message => {
                    this.client.emit('help', message, this)
                },
                retry: message => {
                    this.client.emit('help', message, this)
                }
            }
        };

        switch(opt) {

            case 'ADD':

                // Match
                embed = Object.assign({
                    title: 'MATCH',
                    description: 'Enter the text which the auto-responder will match.'
                }, globalEmbedOptions)

                match = yield {
                    type: 'string',
                    prompt: prompt(embed)
                };

                // Match Type
                options = [
                    ['ANY', '1'],
                    ['EXACT', '2']
                ]

                embed = Object.assign({
                    title: 'MATCH TYPE',
                    description: `Should the text need to match the entire message, or any part of it\n\n${options.map(e => `\`${options.indexOf(e)+1}\` • \`${e[0]}\``).join("\n")}`
                }, globalEmbedOptions)

                type = yield {
                    type: options,
                    prompt: prompt(embed)
                }

                type === 'ANY' ? type = false : type === 'EXACT' ? type = true : null

                // Text Response
                embed = Object.assign({
                    title: 'TEXT RESPONSE',
                    description: 'The message that will be sent when triggered.\n\nType `null` for no text response'
                }, globalEmbedOptions);

                response.text = yield {
                    type: 'string',
                    prompt: prompt(embed)
                };

                if(response.text === 'null') response.text = null; else response.text = `'${response.text.replace(/'/g, `''`)}'` 

                //Emoji Response
                embed = Object.assign({
                    title: 'EMOJI RESPONSES',
                    description: 'The emoji the bot will react with when triggered.\n\nType `null` for no reaction\n\nFor general emojis such as 😄 or 😎, please use the raw emoji (\\😄 or \\😎). To get this you must add `\\` before you send the emoji. `\\:smile:` or `\\:sunglasses:`. Custom emojis can be sent as normal.'
                }, globalEmbedOptions);

                function resolveEmoji(str) {
                    var ranges = [
                        '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])' // U+1F680 to U+1F6FF
                    ];
                    if (str.match(ranges.join('|'))) {
                        return str.match(ranges.join('|'))[0];
                    } else {
                        return undefined;
                    }
                }

                do {

                    response.emoji = yield {
                        type: 'string',
                        prompt: prompt(embed)
                    };

                    // Check

                    if(/(<:.+:\d{18}>)/g.test(response.emoji)) {
                        response.emoji = `'${response.emoji.replace(/\D/g, '')}'`;
                    } else if(resolveEmoji(response.emoji)) {
                        response.emoji = `'${resolveEmoji(response.emoji)}'`
                    } else if(response.emoji === 'null') {
                        response.emoji = null
                    } else {
                        response.emoji = undefined;
                    }

                } while (response.emoji === undefined)

                //

                break;
            case 'REMOVE':

                embed = Object.assign({
                    title: 'REMOVE A RESPONDER',
                    description: 'Provide the `ID` of the responder you wish to remove. `ID`s can be found using the `view` option.\n\n*You can only remove responders from this server.*'
                }, globalEmbedOptions);

                let res;

                do {

                    id = yield {
                        type: 'integer',
                        prompt: prompt(embed)
                    };

                    res = await this.client.db.query(`SELECT * FROM responder WHERE responder_id = ${id}`)
                    
                } while( !res.rows[0] || res.rows[0].guild_id !== message.guild.id );

                embed = Object.assign({
                    title: 'CONFIRM',
                    description: 'Are you sure you want to remove this responder? **Y/N**',
                    fields: [
                        {
                            name: 'MATCH',
                            value: res.rows[0].regex
                        },
                        {
                            name: 'ID',
                            value: `\`${res.rows[0].responder_id}\``,
                            inline: true
                        },
                        {
                            name: 'TYPE',
                            value: res.rows[0].match_content === false ? '`ANY`' : '`EXACT`',
                            inline: true
                        },
                        {
                            name: 'EMOJI',
                            value: res.rows[0].reaction_response,
                            inline: true
                        },
                        {
                            name: 'REPLY',
                            value: res.rows[0].text_response
                        }
                    ]
                }, globalEmbedOptions);

                confirm = yield {
                    type: [
                        ['YES', 'Y'],
                        ['NO', 'N']
                    ],
                    match: 'none',
                    prompt: prompt(embed)
                };

                confirm = confirm === 'YES' ? true : confirm === 'NO' ? false : null

                break;
            case 'VIEW':

                page = yield {

                    type: 'integer',
                    default: 1
                }   

                break;
        }

        return { opt, match, type, response, blacklist, whitelist, id, confirm, page }
    };

    async exec(message, args) {

        if(args.opt === 'ADD') {

            console.log(args)

            await this.client.db.query(`INSERT INTO responder (
                guild_id,
                regex,
                text_response,
                reaction_response,
                match_content,
                blacklist_roles,
                blacklist_channels,
                whitelist_roles,
                whitelist_channels
            ) VALUES (
                ${message.guild.id},
                '${args.match}',
                ${args.response.text},
                ${args.response.emoji},
                ${args.type},
                '${JSON.stringify(args.blacklist.roles)}',
                '${JSON.stringify(args.blacklist.channels)}',
                '${JSON.stringify(args.whitelist.roles)}',
                '${JSON.stringify(args.whitelist.channels)}'
            ) RETURNING *`, (err, res) => {
                //console.log(err, res)
                if(res) {
                    //console.log
                    let embed = {
                        title: 'RESPONDER ADDED',
                        fields: [
                            {
                                name: 'MATCH',
                                value: res.rows[0].regex
                            },
                            {
                                name: 'ID',
                                value: `\`${res.rows[0].responder_id}\``,
                                inline: true
                            },
                            {
                                name: 'TYPE',
                                value: res.rows[0].match_content === false ? '`ANY`' : '`EXACT`',
                                inline: true
                            },
                            {
                                name: 'EMOJI',
                                value: res.rows[0].reaction_response,
                                inline: true
                            },
                            {
                                name: 'REPLY',
                                value: res.rows[0].text_response
                            }
                        ]
                    };

                    message.channel.send({ embed: embed })
                }
            });

            //message.reply('Added.')
        } else if(args.opt === 'REMOVE') {

            if(args.confirm) {

                await this.client.db.query(`DELETE FROM responder WHERE responder_id = ${args.id}`, (err, res) => {
                    if(res) message.channel.send({ embed: {
                        title: 'RESPONDER REMOVED',
                        description: `✅ Responder \`${args.id}\` has been removed from **${message.guild.name}**.`,
                        color: this.client.config.colors.green,
                        timestamp: Date.now()
                    }});
                })

            } else {

                message.channel.send({ embed: {

                    description: `❌ Responder \`${args.id}\` was not removed.`,
                    color: this.client.config.colors.red,
                    timestamp: Date.now()
                }})

            }

        } else if(args.opt === 'VIEW') {

            const responders = (await this.client.db.query(`SELECT * FROM responder WHERE guild_id = ${message.guild.id}`)).rows;
            let [ start, end, arr ] = [ (args.page-1)*10, (args.page*10)-1, [] ]
            end = end >= responders.length ? responders.length - 1 : end;

            console.log(start, end)
            for(let i = start; i <= end; i++) {
                
                arr.push(`\`ID:\` **${responders[i].responder_id}** • ${responders[i].regex}`)
            }

            let embed;

            if(arr.length > 0) {

                embed = {
                    title: `${message.guild.name.toUpperCase()} RESPONDERS`,
                    description: arr.join('\n'),
                    footer: {
                        text: `Page ${args.page} | ${start+1} - ${end+1} of ${responders.length}`
                    },
                    color: await this.client.config.colors.embed(message.guild)
                }

            } else {
                embed = {
                    description: 'This server has no responders.',
                    color: await this.client.config.colors.embed(message.guild)
                }
            }

            message.channel.send({embed: embed})
            
        }
    };
};

module.exports = ResponderCommand;