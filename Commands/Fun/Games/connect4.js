const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');

const commandInfo = commandOptions({
    id: 'connect4',
    aliases: ['knect4', 'c4'],
    description: {
        usage: ['[opponent]'],
        content: 'Play connect 4 against another person.'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES', 'EMBED_MESSAGES'],
    userPermissions: ['SEND_MESSAGES']
}, __dirname);

class Connect4Command extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    * args(message) {

        const opponent = yield {
            type: 'member',
            prompt: this.client.functions.helpPrompt(message, this)
        };

        const x = yield {
            type: 'int',
            default: 7
        };

        const y = yield {
            type: 'int',
            default: 6
        }

        return { opponent };
    };

    async exec(message, args) {

        let client = this.client; let opponent = args.opponent;

        function displayGrid(grid) {

            return grid.map(row => row.map(cell => cell === 0 ? '⚫' : cell === 1 ? '🟡' : cell === 2 ? '🔴' : null).join(' ')).join('\n');

        };

        function drop(grid, column) {

            for (let i = grid.length-1; i >= -1; i--) {

                try {

                    if (grid[i][column] === 0) {
                        
                        return [column, i] // Returns the co-ordinates of the cell it will fall into.
                    };

                } catch {

                        // It will return null if the chosen column is already full
                        // This is because once the loop reaches -1, it will throw
                        // an error because there is no element of index -1 in grid.

                    return null
                }

            };
        };

        function checkGrid(grid, cell, turn) {
            
            let playerID = turn + 1; // PlayerID is the number which fills a cell in the grid to represent that player.
            let counter = 1; // Counter determins how many there are currently in a row.

            // HORIZONTAL CHECK //

            let row = grid[cell[1]];

                // LEFT
                // Check cells to the left
                // Breaks the loop as soon as a non-matching cell is found.

            for (let i = cell[0] - 1; i >= 0; i--) {
                if (row[i] === playerID) {
                    counter++; // +1 to the counter for each
                } else {
                    break;
                };
            };

                // RIGHT
                // Checks cells to the right
                // Breaks the loop as soon as a non-matching cell is found.

            for (let i = cell[0] + 1; i < row.length; i++) {
                if (row[i] === playerID) {
                    counter++; // +1 to the counter for each.
                } else {
                    break;
                };
            };

                console.log(`Horizontal count: ${counter}`);

            if (counter >= 4) {
                return true; // Win
            } else {
                counter = 1; // Reset counter if no horizontal win.
            }

            // VERTICAL CHECK //

            let column = cell[0];

                // DOWN
                // No need to check up, impossible to drop 
                // into a cell with anything above it.

            for (let i = cell[1] + 1; i < grid.length; i++) {
                if (grid[i][column] === playerID) {
                    counter++;
                } else {
                    break;
                }
            };

                console.log(`Vertical count: ${counter}`);

            if (counter >= 4) {
                return true; // Win
            } else {
                counter = 1; // Reset counter if no vertical win.
            }

            // NEGATIVE DIAGONAL //

                // UP & LEFT
                // Move the target cell up and to the left one
                // each iteration

            let newCell = cell.map(i => i - 1); // Without editing the original

            while (newCell[0] >= 0 && newCell[1] >= 0) {

                if (grid[newCell[1]][newCell[0]] === playerID) {
                    counter ++;
                } else {
                    break;
                };
                newCell = newCell.map(i => i - 1);
            };

                // DOWN & RIGHT
                // Move target cell down and right one
                // each iteration

            newCell = cell.map(i => i + 1);

            while (newCell[0] < grid[0].length && newCell[1] < grid.length) {

                if (grid[newCell[1]][newCell[0]] === playerID) {
                    counter ++;
                } else {
                    break;
                };
                newCell = newCell.map(i => i + 1);
            };

                console.log(`Negative diag count: ${counter}`)

            if (counter >= 4) {
                return true; // Win
            } else {
                counter = 1; // Reset counter if no win.
            }            

            // POSITIVE DIAGONAL //

                // DOWN AND LEFT

            newCell = [cell[0] - 1, cell[1] + 1];

            while (newCell[0] >= 0 && newCell[1] < grid.length) {
                console.log(grid[newCell[1]][newCell[0]])
                if (grid[newCell[1]][newCell[0]] === playerID) {
                    counter ++;
                } else {
                    break;
                };
                newCell = [newCell[0] - 1, newCell[1] + 1];
            }

                // UP AND RIGHT

            newCell = [cell[0] + 1, cell[1] - 1];

            while (newCell[0] < grid[0].length && newCell[1] >= 0) {
                if (grid[newCell[1]][newCell[0]] === playerID) {
                    counter ++;
                } else {
                    break;
                };
                newCell = [newCell[0] + 1, newCell[1] - 1];
            }

                console.log(`Positive diag count: ${counter}`)

            if (counter >= 4) {
                return true; // Win
            } else {
                counter = 1; // Reset counter if no win.
            } 

            return false

        };

        // Asking the opponent if they would like to play.

        let request = await message.channel.send(`${opponent}, you have been challenged to Connect 4 by ${message.member}`, { embed: {
            description: 'Type **Y/N** to accept or decline',
            color: await this.client.config.colors.embed(message.guild),
        }})

            // For some reason unknown to me, m.content.toUpperCase() is not a function...
            // Arrays are longer because of that.

        let filter = m => m.author.id === opponent.user.id && ['Y', 'y', 'N', 'n'].includes(m.content);
        const collected = (await message.channel.awaitMessages(filter, { max: 1, time: 60*1000 }));


        if (collected.first()) {

            if (['N', 'n'].includes(collected.first().content)) {
                request.delete();
                return message.reply('Your opponent declined your request.');
            };

        } else {
            request.delete();
            return message.reply('Your opponent never answered...')
        };
    
            // Generate playing grid. To be replaced with optional paraemeters
            // 0 = Empty
            // 1 = Player 1
            // 2 = Player 2

        let grid = [
            [0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0]
        ];

            // gamestate
            // 0 = Playing
            // 1 = Player 1 wins
            // 2 = Player 2 wins
            // 3 = Tie

        let gamestate = 0;

        let players = [message.member, opponent]; let turn = 0; let win;
        let cell;

        while(gamestate === 0) {

            await message.channel.send({ embed: {
                title: 'CONNECT 4',
                description: `${displayGrid(grid)}\n\u200b`,
                fields: [
                    {
                        name: 'CURRENT TURN',
                        value: `${['🟡', '🔴'][turn]} • ${players[turn]}\n\u200b`
                    }
                ],
                color: await client.config.colors.embed(message.guild),
                footer: {
                    text: 'Type \'quit\' to forfeit the game.'
                }
            }});
            
            const response = (await message.channel.awaitMessages(m => m.author.id === players[turn].id, { max: 1, time: 120*1000 })).first();
            
            if (response) {

                    // Allow users to quit mid-game

                if (response.content.toLowerCase() === 'quit') return message.channel.send({ embed: {
                    description: `${['🟡', '🔴'][turn]} • ${players[turn]} quit the game.`,
                    color: this.client.config.colors.red
                }});

                    // Could return NaN, this is ok.
                const column = Math.floor(Number(response.content)) - 1;

                    // Ensure chosen column is within range.
                if (column >= 0 && column < grid[0].length) {

                    cell = drop(grid, column);

                    if (!cell) {
                        continue;
                    }

                } else {
                    continue;
                };

            } else {
                return message.channel.send({ embed: {
                    description: `${['🟡', '🔴'][turn]} • ${players[turn]} timed out. Ending game.`,
                    color: this.client.config.colors.red
                }});
            };

            // Check if there's a win
            win = checkGrid(grid, cell, turn);

            // Set new value
            grid[cell[1]][cell[0]] = turn + 1;

            // Update gamestate if win condition met
            if (win) {
                gamestate = turn + 1;
                break;
            };
            
            turn = turn === 0 ? 1 : 0; // Switch turn

        };

        return message.channel.send({ embed: {
            title: gamestate < 3 ? 'WINNER!' : 'TIE',
            description: gamestate < 3 ? `${['🟡', '🔴'][turn]} • ${players[turn]} wins!\n\n${displayGrid(grid)}` : `Tie... nobody wins...\n\n${displayGrid(grid)}`,
            color: gamestate < 3 ? this.client.config.colors.green : this.client.config.colors.amber,
            timestamp: Date.now()
        }});

    };
};

module.exports = Connect4Command;