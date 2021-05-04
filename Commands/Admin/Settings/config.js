const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'config',
    aliases: ['settings', 'setup'],
    description: {
        usage: ['[option] [option] [value]'],
        content: 'Configure the bot.'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: ['ADMINISTRATOR'],
}, __dirname)

class ConfigCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo)        
    };

    async *args(message) {

        let config = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].config);
        //console.log(config)

        let [setting, option, optionTwo, value, embed, client] = [null, null, null, null, null, this.client];

        let variables = [
            { name: 'Mention', value: '{member}' },
            { name: 'User tag', value: '{tag}' },
            { name: 'Guild name', value: '{guild}' },
            { name: 'Level', value: '{level}' },
            { name: 'XP', value: '{xp}'}
        ];

        let defaultEmbedOptions = await this.client.config.presets.defaultOptions(message.guild)

        function optionEmbed(options) {

            embed = {
                title: 'CHOOSE AN OPTION',
                description: options.map(e => `\`${options.indexOf(e)+1}\` • \`${e[0]}\``).join("\n"),
            };

            Object.assign(embed, defaultEmbedOptions)

            return embed;
        }

        const { prompt } = this.client.functions;
        
        let options = [
            ['LEVELS', 'LEVEL', '1'],
            ['MESSAGES', 'MESSAGE', 'MSG', '2'],
            ['ROLES', '3']
        ];

        setting = yield {

            type: options,
            prompt: prompt(optionEmbed(options))
        };

        switch (setting) {

            case 'LEVELS':

                options = [
                    ['MESSAGE', 'MSG', '1'],
                    ['ROLES', 'ROLE', '2'],
                    ['CHANNELS', 'CHANNEL', '3']
                ];

                option = yield {

                    type: options,
                    prompt: prompt(optionEmbed(options))
                };

                switch (option) {

                    case 'MESSAGE':

                        options = [
                            ['TYPE', '1'],
                            ['TEXT', '2']
                        ]

                        optionTwo = yield {

                            type: options,
                            prompt: prompt(optionEmbed(options))
                        };

                        switch (optionTwo) {

                            case 'TYPE':

                                options = [
                                    ['MESSAGE', 'MSG', '1'],
                                    ['EMBED', '2']
                                ]

                                value = yield {
                                    
                                    type: options,
                                    prompt: prompt(optionEmbed(options))
                                };

                                break;

                            case 'TEXT':

                                embed = {
                                    title: 'LEVEL-UP MESSAGE',
                                    description: 'Set the text that will be sent when a member levels up in this server.',
                                    fields: [
                                        {
                                            name: 'VARIABLES',
                                            value: variables.map(v => `\`${v.value}\` : ${v.name}`).join('\n')
                                        }
                                    ],
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: 'string',
                                    match: 'rest',
                                    prompt: prompt(embed)
                                    
                                };

                                break;
                        };

                        break;

                    case 'ROLES':

                        options = [
                            ['STACK', '1'],
                            ['REWARDS', '2']
                        ]

                        optionTwo = yield {

                            type: options,
                            prompt: prompt(optionEmbed(options))
                        }

                        switch (optionTwo) {

                            case 'STACK':

                                options = [
                                    ['TRUE', '1'],
                                    ['FALSE', '2']
                                ];

                                value = yield {

                                    type: options,
                                    prompt: prompt(optionEmbed(options))
                                }

                                break;

                            case 'REWARDS':

                                let currentRoles = config.levels.roles.rewards
                                
                                currentRoles = currentRoles.length !== 0 ? `${currentRoles.map(r => `Level: \`${r.level}\`, <@&${r.id}>`).join('\n')}` : '`N/A`'

                                embed = {
                                    title: 'REWARD ROLES',
                                    description: `Choose roles which will be rewarded to people after reaching a certain level. Seperate arguments with a \`,\`\n\n*To add a reward role:*\n\`<level>:<roleResolvable>\`\n\n*To remove a reward role:*\n\`remove:<roleResolvable>\``,
                                    fields: [
                                        {
                                            name: 'EXAMPLES',
                                            value: '`10:Level 10, 30:227848397447626752, remove:@Moderator`',
                                        },
                                        {
                                            name: 'CURRENT ROLES',
                                            value: currentRoles
                                        }
                                    ],
                                    
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: 'string',
                                    match: 'rest',
                                    prompt: prompt(embed)
                                };

                                break;
                        }

                        break;

                    case 'CHANNELS':

                        options = [
                            ['MODE', '1'],
                            ['BLACKLIST', '2'],
                            ['WHITELIST', '3']
                        ]

                        optionTwo = yield {

                            type: options,
                            prompt: prompt(optionEmbed(options))
                        };

                        switch (optionTwo) {

                            case 'MODE':

                                options = [
                                    ['BLACKLIST', '1'],
                                    ['WHITELIST', '2']
                                ]

                                value = yield {

                                    type: options,
                                    prompt: prompt(optionEmbed(options))

                                }

                                break;

                            case 'BLACKLIST':

                                let blacklist = config.levels.channels.blacklist;

                                if(blacklist.length > 0) {
                                    blacklist = blacklist.map(c => `- <#${c}>`).join("\n")
                                } else {
                                    blacklist = '`NULL`'
                                }

                                embed = {
                                    title: 'CHANNEL BLACKLIST',
                                    description: `Prevent members from earning XP in these channels`,
                                    fields: [
                                        {
                                            name: 'ADDING CHANNELS',
                                            value: `\`add:<channelResolvable>\``
                                        },
                                        {
                                            name: 'REMOVING CHANNELS',
                                            value: '\`remove:<channelResolvable>\`'
                                        },
                                        {
                                            name: 'CURRENT BLACKLIST',
                                            value: blacklist
                                        }
                                    ],
                                    
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: /(^(add|remove|rm):.+$)|(^clear$)/gi,
                                    match: 'rest',
                                    prompt: prompt(embed)
                                    
                                };

                                break;

                            case 'WHITELIST':

                                let whitelist = config.levels.channels.whitelist;

                                if(whitelist.length > 0) {
                                    whitelist = whitelist.map(c => `- <#${c}>`).join("\n")
                                } else {
                                    whitelist = '`NULL`'
                                }

                                embed = {
                                    title: 'CHANNEL WHITELIST',
                                    description: `Only allow members from to XP in these channels`,
                                    fields: [
                                        {
                                            name: 'ADDING CHANNELS',
                                            value: `\`add:<channelResolvable>\``
                                        },
                                        {
                                            name: 'REMOVING CHANNELS',
                                            value: '\`remove:<channelResolvable>\`'
                                        },
                                        {
                                            name: 'CURRENT WHITELIST',
                                            value: whitelist
                                        }
                                    ],
                                    
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: /(^(add|remove|rm):.+$)|(^clear$)/gi,
                                    match: 'rest',
                                    prompt: prompt(embed)
                                };

                                break;
                        }

                        break;
                }

                break;
        
            case 'MESSAGES': 

                options = [
                    ['EMBEDS', 'EMBED', '1'],
                    ['WARNINGS', 'WARNS', 'WARNING', '2'],
                    ['FILTER', 'WORDFILTER', '3'],
                ];

                option = yield {

                    type: options,
                    prompt: prompt(optionEmbed(options))
                };

                switch (option) {

                    case 'EMBEDS':

                        options = [
                            ['COLOR', 'COLOUR', '1']
                        ];
                        
                        optionTwo = yield {

                            type: options,
                            prompt: prompt(optionEmbed(options))
                        };

                        switch (optionTwo) {

                            case 'COLOR':

                                embed = {
                                    title: 'TYPE A COLOR',
                                    description: 'Any resolveable color.'
                                };

                                Object.assign(embed, defaultEmbedOptions);

                                value = yield {

                                    type: 'string',
                                    match: 'rest',
                                    prompt: prompt(embed)

                                };

                                break;

                        }

                        break;

                    case 'WARNINGS':

                        options = [
                            ['MUTE', 'MUTED', '1'],
                            ['KICK', 'KICKED', '2']
                        ]

                        optionTwo = yield {
                            type: options,
                            prompt: prompt(optionEmbed(options))
                        };

                        switch (optionTwo) {

                            case 'MUTE':

                                embed = {
                                    title: 'MUTE WARNING MESSAGE',
                                    description: 'Set the text that will be sent to a user when they are muted in this server.',
                                    fields: [
                                        {
                                            name: 'VARIABLES',
                                            value: variables.map(v => `\`${v.value}\` : ${v.name}`).join('\n')
                                        }
                                    ],
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: 'string',
                                    match: 'rest',
                                    prompt: prompt(embed)
                                    
                                };

                                break;

                            case 'KICK':

                                embed = {
                                    title: 'KICK WARNING MESSAGE',
                                    description: 'Set the text that will be sent to a user when they are muted in this server.',
                                    fields: [
                                        {
                                            name: 'VARIABLES',
                                            value: variables.map(v => `\`${v.value}\` : ${v.name}`).join('\n')
                                        }
                                    ],
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: 'string',
                                    match: 'rest',
                                    prompt: prompt(embed)
                                    
                                };

                                break;
                        };

                        break;

                    case 'FILTER':

                        options = [
                            ['LIST', '1'],
                            ['EDIT', 'MODIFY', '2']
                        ];

                        optionTwo = yield {
                            type: options,
                            prompt: prompt(optionEmbed(options))
                        };

                        switch (optionTwo) {
                            
                            case 'LIST':

                                break;
                        
                            case 'EDIT':

                                embed = {
                                    title: 'EDIT WORD FILTER',
                                    description: 'Edit the word filter for this server.\nSeparate arguments with a `,`\n\n*To add a word:*\n`<any|exact>:<text>`\n\n*To remove a word:*\n`<remove|rm>:<text>`\n\n`ANY` matches the text at any point in a message\n`EXACT` only matches if the entire message.',
                                    fields: [
                                        {
                                            name: 'EXAMPLES',
                                            value: '`any:poop, exact:i hate you, rm:bruh`'
                                        },
                                        {
                                            name: 'ANY',
                                            value: config.messages.wordFilter.any.length > 0 ? config.messages.wordFilter.any.map(m => `\`${m}\``).join(',\n') : '`N/A`',
                                            inline: true
                                        },
                                        {
                                            name: 'EXACT',
                                            value: config.messages.wordFilter.exact.length > 0 ? config.messages.wordFilter.exact.map(m => `\`${m}\``).join(',\n') : '`N/A`',
                                            inline: true
                                        }
                                    ]
                                };

                                Object.assign(embed, defaultEmbedOptions)

                                value = yield {

                                    type: 'string',
                                    match: 'rest',
                                    prompt: prompt(embed)
                                    
                                };

                                break;
                        }

                        break;
                }

                break;
            
            case 'ROLES': 

                options = [
                    ['SEPARATORS', 'SPLITTERS', '1'],
                    ['JOIN', 'JOINROLES', 'INITIAL', '2']
                ];

                option = yield {

                    type: options,
                    prompt: prompt(optionEmbed(options))
                };

                let currentRoles;

                switch (option) {

                    case 'SEPARATORS':

                        currentRoles = config.roles.separators
                                    
                        currentRoles = currentRoles.length !== 0 ? `${currentRoles.map(r => `<@&${r}>`).join('\n')}` : '`N/A`'

                        embed = {
                            title: 'SET SEPARATOR ROLES',
                            description: 'Set roles which will be given/removed if a member has roles inbetween them.\nSeperate arguments with a \`,\`\n\n*To add a separator role:*\n`add:[role]`\n\n*To remove a separator role:*\n`remove:[role]`',
                            fields: [
                                {
                                    name: 'EXAMPLES',
                                    value: '`add:GAME ROLES, add:227848397447626752, remove:@MOD ROLES`'
                                },
                                {
                                    name: 'CURRENT ROLES',
                                    value: currentRoles
                                }
                            ]
                        };

                        Object.assign(embed, defaultEmbedOptions)

                        value = yield {

                            type: 'string',
                            match: 'rest',
                            prompt: prompt(embed)
                        };

                        break;

                    case 'JOIN':

                        currentRoles = config.roles.join
                                    
                        currentRoles = currentRoles.length !== 0 ? `${currentRoles.map(r => `<@&${r}>`).join('\n')}` : '`N/A`'

                        embed = {
                            title: 'SET JOIN ROLES',
                            description: 'Set roles which will be given when a member joins the server.\nSeperate arguments with a \`,\`\n\n*To add a role:*\n`add:[role]`\n\n*To remove a role:*\n`remove:[role]`',
                            fields: [
                                {
                                    name: 'EXAMPLES',
                                    value: '`add:Newbie ROLES, add:227848397447626752, remove:@Players`'
                                },
                                {
                                    name: 'CURRENT ROLES',
                                    value: currentRoles
                                }
                            ]
                        };

                        Object.assign(embed, defaultEmbedOptions)

                        value = yield {

                            type: 'string',
                            match: 'rest',
                            prompt: prompt(embed)
                        };

                        break;
                }

                break;
        
        };

        return { setting, option, optionTwo, value };
    };

    async exec(message, args) {

        let config = JSON.parse((await this.client.db.query(`SELECT config FROM guilds WHERE guild_id = ${message.guild.id}`)).rows[0].config);
        let val;

        try {
        
            switch(args.setting) {

                case 'LEVELS':

                    if (args.option === 'MESSAGE') {

                        if(args.optionTwo === 'TYPE') {

                            config.levels.message.type = args.value.toLowerCase();
                            val = args.value;

                        } else if(args.optionTwo === 'TEXT') {

                            config.levels.message.text = args.value;
                            val = args.value;

                        };
                    
                    } else if (args.option === 'ROLES') {

                        if(args.optionTwo === 'STACK') {

                            if(args.value === 'TRUE') {
                                config.levels.roles.stack = true; val = '`true`';
                            } else if(args.value === 'FALSE') {
                                config.levels.roles.stack = false; val = '`false`';
                            };

                        } else if(args.optionTwo === 'REWARDS') {

                            let [add, remove, unresolved] = [[], [], []];

                            let roles = config.levels.roles.rewards

                            for(const role of roles) {
                                if(!message.guild.roles.cache.get(role.id)) remove.push(role.id);
                            }

                            let arr = args.value.split(',');

                            for(let str of arr) {

                                let split = str.split(':');
                                if(split.length !== 2) {unresolved.push(`\`${str.trim()}\``); continue;}
                                let [lvl, role] = [split[0].trim(), this.client.util.resolveRole(split[1].trim(), message.guild.roles.cache)]

                                if(role) if(role.id === message.guild.roles.everyone.id) {unresolved.push(`\`${str.trim()}\``); continue;}

                                if(lvl === 'remove' || lvl === 'rm') {

                                    if(role) remove.push(role.id); else unresolved.push(`\`${str.trim()}\``)

                                } else if(!isNaN(Number(lvl)) && Number(lvl) >= 0) {

                                    if(role) add.push({level: lvl, id: role.id}); else unresolved.push(`\`${str.trim()}\``)

                                } else {

                                    unresolved.push(`\`${str.trim()}\``)

                                };

                            };

                            for(let i of add) {

                                if(!roles.some(r => r.id === i.id && r.level === i.level)) {
                                    roles.push(i)
                                } else {
                                    add.splice(add.indexOf(i))
                                }
                            };

                            for(let i of remove) {

                                if(roles.some(r => r.id === i)) {
                                    roles = roles.filter(r => r.id !== i)
                                } else {
                                    remove.splice(remove.indexOf(i))
                                }
                            }

                            config.levels.roles.rewards = roles;

                            val = `Added/Removed the following level reward roles:\n\n**Added**\n${add.map(r => `Level \`${r.level}\`: <@&${r.id}>`).join('\n')}\n\n**Removed**\n${remove.map(r =>`<@&${r}>`).join('\n')}\n\n**Unresolved**\n${unresolved.join('\n')}`

                        }

                    } else if (args.option === 'CHANNELS') {

                        if(args.optionTwo === 'MODE') {

                            config.levels.channels.mode = args.value.toLowerCase();
                            val = `\`${args.value}\``

                        } else if(args.optionTwo === 'BLACKLIST') {

                            let blacklist = config.levels.channels.blacklist;

                            if (args.value.match[0] === 'clear') {config.levels.channels.blacklist = []; val = '`cleared`'; break;}

                            let split = args.value.match[0].split(':')

                            let [channel] = [];

                            if(split.length !== 2) throw 'invalid input';
                            
                            channel = this.client.util.resolveChannel(split[1], message.guild.channels.cache);

                            if(split[0].toLowerCase() === 'add') {

                                if(channel) {
                                    blacklist.push(channel.id);
                                    val = `+ Added <#${channel.id}>`;
                                } else {
                                    throw 'invalid input';
                                };

                            } else if(split[0].toLowerCase() === 'remove' || split[0].toLowerCase() === 'rm') {

                                if(channel) {
                                    if(blacklist.includes(channel.id)) {
                                        blacklist.splice(blacklist.indexOf(channel.id));
                                        val = `- Removed <#${channel.id}>`;
                                    };
                                } else {
                                    throw 'invalid input';
                                };

                            } else {
                                throw 'invalid input';
                            };

                            config.levels.channels.blacklist = blacklist;

                        } else if(args.optionTwo === 'WHITELIST') {

                            let whitelist = config.levels.channels.whitelist;

                            if (args.value.match[0] === 'clear') {config.levels.channels.whitelist = []; val = '`cleared`'; break;}

                            let split = args.value.match[0].split(':')

                            let [channel] = [];

                            if(split.length !== 2) throw 'invalid input';
                            
                            channel = this.client.util.resolveChannel(split[1], message.guild.channels.cache);

                            if(split[0].toLowerCase() === 'add') {

                                if(channel) {
                                    whitelist.push(channel.id);
                                    val = `+ Added <#${channel.id}>`;
                                } else {
                                    throw 'invalid input';
                                };

                            } else if(split[0].toLowerCase() === 'remove' || split[0].toLowerCase() === 'rm') {

                                if(channel) {
                                    if(whitelist.includes(channel.id)) {
                                        whitelist.splice(whitelist.indexOf(channel.id));
                                        val = `- Removed <#${channel.id}>`;
                                    };
                                } else {
                                    throw 'invalid input';
                                };

                            } else {
                                throw 'invalid input';
                            };

                            config.levels.channels.whitelist = whitelist;

                        };

                    };

                    break;

                case 'MESSAGES':

                    if(args.option === 'EMBEDS') {

                        if(args.optionTwo === 'COLOR') {

                            let color = this.client.functions.resolveHex(args.value.toLowerCase());
                            //console.log(color)

                            if(color) { 

                                config.messages.embeds.color = color;
                                val = `\`${color}\``

                            } else {
                                throw 'invalid input'
                            }

                        } 

                    } else if( args.option === 'WARNINGS') {

                        if(args.optionTwo === 'MUTE') {

                            config.messages.warnings.mute = args.value;
                            val = args.value;

                        } else if(args.optionTwo === 'KICK') {

                            config.messages.warnings.kick = args.value;
                            val = args.value;

                        }

                    } else if(args.option === 'FILTER') {

                        if(args.optionTwo === 'LIST') {



                        } else if(args.optionTwo === 'EDIT') {

                            let filter = config.messages.wordFilter;

                            let [words, word, action] = [args.value.split(','), undefined];
                            let [removed, any, exact, unresolved] = [[], [], [], []];

                            for (let w of words) {

                                w = w.trim();
                                
                                [action, word] = [w.split(':')[0], w.split(':')[1]];

                                if(action === 'rm' || action === 'remove') {
                                    
                                    if(filter.any.filter(s => s === word).length > 0 || filter.exact.filter(s => s === word).length > 0) {

                                        filter.any = filter.any.filter(s => s !== word);
                                        filter.exact = filter.exact.filter(s => s !== word);
                                        removed.push(word)

                                    } else {

                                        unresolved.push(w)

                                    }

                                } else if(action === 'any') {

                                    filter.any.push(word.trim().toLowerCase());
                                    any.push(word.trim().toLowerCase());

                                } else if(action === 'exact') {

                                    filter.exact.push(word.trim().toLowerCase());
                                    exact.push(word.trim().toLowerCase());

                                } else {

                                    unresolved.push(w);
                                    
                                }

                            }

                            config.messages.wordFilter = filter;
                            val = `Modified the word filter with the following values:\n\n**ANY**\n${any.map(m => `\`${m}\``).join(',\n')}\n\n**EXACT**\n${exact.map(m => `\`${m}\``).join(',\n')}\n\n**REMOVED**\n${removed.map(m => `\`${m}\``).join(',\n')}\n\n**UNRESOLVED**\n${exact.map(m => `\`${m}\``).join(',\n')}`

                        }

                    }

                    break;
            
                case 'ROLES': 

                    if(args.option === 'SEPARATORS') {
                            
                        let [ add, remove, unresolved, role ] = [[], [], []];

                        let roles = config.roles.separators;
                        
                        for(const id of roles) {
                            if(!message.guild.roles.cache.get(id)) remove.push(id);
                        }

                        let values = args.value.split(",");

                        for(let value of values) {

                            value = value.trim();
                            
                            if(/^(add|remove|rm):.+/gi.test(value)) {

                                let arr = value.split(":");
                                
                                if(arr[0].toLowerCase() === 'add') {
                                    role = this.client.util.resolveRole(arr[1], message.guild.roles.cache);
                                    if(role) {add.push(role.id)} else {unresolved.push(value)}
                                } else if(arr[0].toLowerCase() === 'remove' || arr[0].toLowerCase() === 'rm') {
                                    role = this.client.util.resolveRole(arr[1], message.guild.roles.cache);
                                    if(role) {remove.push(role.id)} else {unresolved.push(value)}
                                }

                            } else {
                                unresolved.push(value)
                            }
                            
                        }
                        
                        for(let i of add) {

                            if(!roles.includes(i)) {
                                roles.push(i)
                            } else {
                                add.splice(add.indexOf(i))
                            }
                        };

                        for(let i of remove) {

                            if(roles.includes(i)) {
                                roles = roles.filter(r => r !== i)
                            } else {
                                remove.splice(remove.indexOf(i))
                            }
                        }

                        config.roles.separators = roles
                        val = `Added/Removed the following separator roles:\n\n**Added**\n${add.map(r => `<@&${r}>`).join('\n')}\n\n**Removed**\n${remove.map(r =>`<@&${r}>`).join('\n')}\n\n**Unresolved**\n${unresolved.join('\n')}`

                    } else if(args.option === 'JOIN') {

                        try{
                            
                            let [ add, remove, unresolved, role ] = [[], [], []];
    
                            let roles = config.roles.join;
                            
                            for(const id of roles) {
                                if(!message.guild.roles.cache.get(id)) remove.push(id);
                            }
    
                            let values = args.value.split(",");
    
                            for(let value of values) {
    
                                value = value.trim();
                                
                                if(/^(add|remove|rm):.+/gi.test(value)) {
    
                                    let arr = value.split(":");
                                    
                                    if(arr[0].toLowerCase() === 'add') {
                                        role = this.client.util.resolveRole(arr[1], message.guild.roles.cache);
                                        if(role) {add.push(role.id)} else {unresolved.push(value)}
                                    } else if(arr[0].toLowerCase() === 'remove' || arr[0].toLowerCase() === 'rm') {
                                        role = this.client.util.resolveRole(arr[1], message.guild.roles.cache);
                                        if(role) {remove.push(role.id)} else {unresolved.push(value)}
                                    }
    
                                } else {
                                    unresolved.push(value)
                                }
                                
                            }
                            
                            for(let i of add) {
    
                                if(!roles.includes(i)) {
                                    roles.push(i)
                                } else {
                                    add.splice(add.indexOf(i))
                                }
                            };
    
                            for(let i of remove) {
    
                                if(roles.includes(i)) {
                                    roles = roles.filter(r => r !== i)
                                } else {
                                    remove.splice(remove.indexOf(i))
                                }
                            }
    
                            config.roles.join = roles
                            val = `Added/Removed the following join roles:\n\n**Added**\n${add.map(r => `<@&${r}>`).join('\n')}\n\n**Removed**\n${remove.map(r =>`<@&${r}>`).join('\n')}\n\n**Unresolved**\n${unresolved.join('\n')}`
    
    
                            //console.log(roles)
                        }catch(e) {console.log(e)}

                    }

                    break;
            }

        } catch (err) {
            console.log(err)

            if(err === 'invalid input') {
                return message.channel.send('Invalid input.')
            }
        }

        await this.client.db.query(`UPDATE guilds SET config = '${JSON.stringify(config)}' WHERE guild_id = ${message.guild.id}`);
        message.channel.send({ embed: {
            title: `UPDATED ${message.guild.name} CONFIG`,
            fields: [
                {
                    name: 'CHANGED',
                    value: args.optionTwo ? `**\`${args.setting} ${args.option} ${args.optionTwo}\`**` : `**\`${args.setting} ${args.option}\`**`
                },
                {
                    name: 'VALUE',
                    value: val
                }
            ], 
            color: await this.client.config.colors.embed(message.guild)
        }});
    };
};

module.exports = ConfigCommand;