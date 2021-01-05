const { Command } = require('discord-akairo');

class BackdateCommand extends Command {
    constructor() {
        super('backdate', {
            aliases: ['backdate', 'bd'],
            clientPermissions: ['ADMINISTRATOR'],
            args: [
                {
                    id: 'type',
                    type: [
                        ['ALL'],
                        ['BEFORE']
                    ],
                    default: 'ALL'
                }
            ],
            ownerOnly: true
        });
    };

    async exec(message, args) {

        const guild = message.guild;

        let [ members, n, total ] = [[], 0, 0];

        const timestamp = args.type === 'ALL' ? Date.now() : (await guild.members.fetch(this.client.user.id)).joinedTimestamp

        let sent = await message.channel.send('Backdating...')

        for(const [,channel] of guild.channels.cache.filter(c => c.type === 'text')) {

            n++;

            let messages = await channel.messages.fetch({ limit: 100 })

            if(messages.size < 1) continue;

            await sent.edit({ embed: {
                title: 'SCANNING CHANNEL',
                description: `\`[${this.client.functions.UCT()}]\`\n\n${channel} \`${n}/${guild.channels.cache.filter(c => c.type === 'text').size}\``,
                fields: [
                    {
                        name: 'MESSAGES SCANNED SO FAR',
                        value: `\`${this.client.functions.groupDigits(total)}\``,
                    }
                ],
                color: await this.client.config.colors.embed(guild)
            }});         

            let iterations = 0;
            while (messages.size > 0) {
                iterations++;

                for(const [,msg] of messages) {
                    
                    if(msg.author.bot) continue;
                    
                    try{
                        if(members.find(m => m.id === msg.author.id)) {
                            members.find(m => m.id === msg.author.id).messages.push(msg.createdTimestamp)
                        } else {
                            members.push({id: msg.member.id, messages: [msg.createdTimestamp], xpMessages: 0, xp: 0 })
                        }
                    } catch(e) {
                        console.log(e)
                    }

                }

                total += messages.size

                messages = await channel.messages.fetch({ limit: 100, before: messages.last().id })

                if(iterations % 6 === 5) {
                    await sent.edit({ embed: {
                        title: 'SCANNING CHANNEL',
                        description: `\`[${this.client.functions.UCT()}]\`\n\n${channel} \`${n}/${guild.channels.cache.filter(c => c.type === 'text').size}\``,
                        fields: [
                            {
                                name: 'MESSAGES SCANNED SO FAR',
                                value: `\`${this.client.functions.groupDigits(total)}\``,
                            }
                        ],
                        color: await this.client.config.colors.embed(guild)
                    }});   
                }
            }

            await sent.edit({ embed: {
                title: 'SCANNED CHANNEL',
                description: `\`[${this.client.functions.UCT()}]\`\n\n${channel} \`${n}/${guild.channels.cache.filter(c => c.type === 'text').size}\``,
                fields: [
                    {
                        name: 'MESSAGES SCANNED SO FAR',
                        value: `\`${this.client.functions.groupDigits(total)}\``,
                    }
                ],
                color: await this.client.config.colors.green
            }});            
        }

        let member;
        for(let i = 0; i < members.length; i++) {

            member = members[i];
            member.messages.sort();

            for(let t = 1; t < member.messages.length; t++) {
                if(member.messages[t]-member.messages[t-1] > 60*1000) {
                    member.xp += this.client.functions.rng(3,7);
                    member.xpMessages += 1;
                }
            }

            member.messages = member.messages.length

        }

        let [ DB ] = [ this.client.db ];

        for(const m of members) {

            if(!(await DB.query(`SELECT user_id FROM users WHERE user_id = ${m.id}`)).rows[0]) {

                await DB.query(`INSERT INTO users (user_id) VALUES (${m.id});`);
                console.log(`Added to users with user_id ${m.id}`)
            
            } 
            
            if(!(await DB.query(`SELECT user_id FROM members WHERE user_id = ${m.id} AND guild_id = ${guild.id}`)).rows[0]) {
                console.log(true)
                await DB.query(`INSERT INTO members (user_id, guild_id) VALUES (${m.id}, ${guild.id});`, (err, res) => {
                    console.log(`Added to members with user_id ${m.id} and guild_id ${guild.id}`)
                })
            }

            await DB.query(`UPDATE members SET messages = messages + ${m.messages}, xp = xp + ${m.xp}, xp_messages = xp_messages + ${m.xpMessages} WHERE user_id = ${m.id} AND guild_id = ${guild.id}`, (err, res) => {console.log(err, res)})

            this.client.emit('xp-levelUp', await (await this.client.guilds.fetch(guild.id)).members.fetch(m.id), 0, false)

        }

        await sent.delete();
        message.channel.send('', { embed: {
            title: 'BACKDATE COMPLETE',
            color: this.client.config.colors.green,
            description: `\`[${this.client.functions.UCT()}]\``,
            fields: [
                {
                    name: 'CHANNELS',
                    value: `\`${guild.channels.cache.filter(c => c.type === 'text').size}\``,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: 'MEMBERS',
                    value: `\`${members.length}\``,
                    inline: true
                },
                {
                    name: 'MESSAGES',
                    value: `\`${this.client.functions.groupDigits(total)}\``
                }
            ]
        }})
    };
};

module.exports = BackdateCommand;