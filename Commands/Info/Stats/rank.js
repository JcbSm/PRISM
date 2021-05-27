const { Command } = require('discord-akairo');
const { loadImage, createCanvas, registerFont } = require('canvas');
const { canvasRGBA } = require('stackblur-canvas')
const Color = require('color')
const Discord = require('discord.js')
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'rank',
    aliases: [],
    channel: 'giuld',
    typing: true,
    description: {
        usage: ['(member)'],
        content: 'View the level and rank of a member.'
    },
    clientPermissions: ['SEND_MESSAGES'],
    userPermissions: []

}, __dirname)

class RankCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args() {

        const member = yield {
            type:'member',
            default: message => message.member
        };

        return { member };

    };

    async exec(message, args) {

        return message.channel.send(null, new Discord.MessageAttachment(await this.client.getRankCard(args.member), 'rank.png'));

    };
};

module.exports = RankCommand;