/* ---------------- DISCORD.JS CHESS ------------------ */

/// HOW TO ///

// A game is started when a player executes the chess command.
// Algebraic square notation is used to move pieces around.
//      eg. "B1C3" will move the piece in "B1" to "C3"

/// THE BOARD ///

// The board is a 1D array of 64 squares.
// A 1D array was used because it was easier.
//
// Moving a piece left -1
// Movign a piece right +1
// Moving a piece up +8
// Moving a piece down -8
// These can be combined (UP+LEFT = +7)


/// PIECES ///

// All pieces are assigned an ID.
// This ID can identify the type and color of that piece.
// Each type has an integer 1-6
// Each colour has an integer 8 or 16.
// By adding the typeInt and colorInt, each piece will have a unique number assigned.

// Color IDs:
// 0 | 8 = WHITE
// 1 | 16 = BLACK

// Type IDs:
// 1 = KING
// 2 = QUEEN
// 3 = BISHOP
// 4 = KNIGHT
// 5 = ROOK
// 6 = PAWN


/// GAME ///

// The game class stores data about the game.
// Players, state etc.
// When a new Game is createed, everything else is created too.


// Credit to Sebastian Lague for helping massively with grasping the concepts here, I wouldn't have been able to do this without the help of his videos.

const instructions = `
Here is a quick explaination on how to play. This assumes you already know how to play chess.
If you don't already know, find out [here](https://www.chess.com/learn-how-to-play-chess).

Pieces are moved using algebraic notation.
e.g. \`A1\` or \`C6\`.

When asked to move a piece, type the square of the piece you'd like to move, followed by the squar to move it to.
For example: "E2E4" or "F1G3"
`

const { Command } = require('discord-akairo');
const { commandOptions } = require('../../../index');
const { createCanvas, registerFont, loadImage } = require('canvas');
const { NewsChannel } = require('discord.js');

const commandInfo = commandOptions({
    id: 'chess',
    aliases: [],
    description: {
        usage: ['[opponent]', '[opponent] (FEN)'],
        content: 'Play a game of chess.\n\nLoading illegal FEN may break it.'
    },
    channel: 'guild',
    typing: false,
    clientPermissions: ['SEND_MESSAGES', 'EMBED_MESSAGES'],
    userPermissions: ['SEND_MESSAGES'],
}, __dirname);

class ChessCommand extends Command {
    constructor() {
        super(commandInfo.id, commandInfo);
    };

    *args (message) {

        const opponent = yield {
            type: 'member',
            prompt: this.client.functions.helpPrompt(message, this)
        }

        const fen = yield {
            match: 'rest'
        };

        return { opponent, fen }

    };

    async exec(message, args) {

        // Ask the opponent if they wish to play chess.
        let ask = await message.channel.send(`${args.opponent} you have been challenged to Chess.`, { embed: {
            title: 'CHESS',
            description: `React with ✅ or ❌ to accept or decline\n\u200b`,
            fields: [
                {
                    name: 'HOW TO PLAY',
                    value: instructions
                }
            ],
            color: await this.client.config.colors.embed(message.guild)
        }});

        await ask.react('✅'); ask.react('❌'); // Add reactions

        // Await reactions from the opponent to see if they wish to play.
        let res = (await ask.awaitReactions(async (reaction, user) => {
            return ['✅', '❌'].includes(reaction.emoji.name) && user.id === args.opponent.id;
        }, { max: 1, time: 60000})).first(); // 60s timeout

        if (!res) { // If the opponent doesnt respond.
            ask.delete();
            return message.reply('You opponent never responded.')

        } else if (res.emoji.name === '❌') { // If the opponent declines.
            ask.delete();
            return message.reply('Your opponent declined.')
        };

        // Else, Carry on!

        let sprite_sheet = await loadImage('./Assets/Chess/chess_pieces.png');
        let file_headers = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        let rank_headers = ['1', '2', '3', '4', '5', '6', '7', '8'];

        class Board {
            constructor(game, fenBoard) {
                this.game = game
                this.squares = new Array(64);
                this.loadFen(fenBoard);
            }

            get takenPieces() {

                // THe pieces that each player will start with.
                const startingPieces = [

                    1, 2,
                    3, 3,
                    4, 4,
                    5, 5,

                    6, 6,
                    6, 6,
                    6, 6,
                    6, 6,
                ];

                let white = [...startingPieces]; let black = [...startingPieces]; // Copy array

                this.squares.forEach(p => { // Loop over all squares

                    if (!p) return;

                    if (p.colorInt) { // Black

                        // If there is a piece on the baord, remove that piece from the taken pieces array
                        let i = black.indexOf(p.typeInt); 
                        black.splice(i, 1);


                    } else { // White

                        // Same as before
                        let i = white.indexOf(p.typeInt);
                        white.splice(i, 1);

                    };

                });

                // This method assumes that the game is setup properly,
                // but if people mess around and load improper FEN then that's their problem.

                return { white, black };
            };

            loadFen(fenBoard) {

                const pieceTypeDict = {

                    'k': 1,
                    'q': 2,
                    'b': 3,
                    'n': 4,
                    'r': 5,
                    'p': 6

                };

                let [file, rank] = [0, 7];
                let [color, type] = []

                for (const symbol of fenBoard) {
                    if (symbol === '/') {
                        file = 0;
                        rank--;
                    } else {
                        if (/^\d+$/.test(symbol)) {
                            file += Number(symbol);
                        } else {
                            color = symbol === symbol.toUpperCase() ? 8 : 16;
                            type = pieceTypeDict[symbol.toLowerCase()];

                            this.squares[rank * 8 + file] = new Piece(color, type, this)
                            file++;
                        }
                    }

                }

            };

            getFileRank(square) {
                let file = square % 8;
                let rank = Math.floor(square / 8);

                return {file, rank};
            };

            check(squares, colorInt) {

                let check = false;
                
                // Find king
                let kingSquare = squares.findIndex(p => p && p.typeInt === 1 && p.colorInt === colorInt);
                let kingFileRank = this.getFileRank(kingSquare);
                
                // Check for knights
                
                let movesL = [-17, -10, 6, 15];
                let movesR = [-15, -6, 10, 17];

                let current = this.getFileRank(kingSquare);

                let target;

                // For all the moves that go left
                // check it doesnt loop around the left of the board.

                movesL.forEach(m => {
                    target = this.getFileRank(kingSquare + m);

                    if (target.file < current.file && target.rank < 8 && target.rank >= 0) { // Check no loop & rank is within boundries.
                        let targetPiece = squares[kingSquare + m]
                        if (targetPiece && targetPiece.typeInt === 4 && targetPiece.colorInt !== colorInt) { // Check for knight of opposite color
                            return check = true;
                        };
                    };
                });

                if (check) return check; // REturn to avoid checking anymore.

                // For all the moves that go right
                // check it doesn't loop around the right of the board.

                movesR.forEach(m => {
                    target = this.getFileRank(kingSquare + m);

                    if (target.file > current.file && target.rank < 8 && target.rank >= 0) { // Check no loop & rank is within boundries.
                        let targetPiece = squares[kingSquare + m]
                        if (targetPiece && targetPiece.typeInt === 4 && targetPiece.colorInt !== colorInt) { // Check for knight of opposite color
                            return check = true;
                        };
                    };
                });

                if (check) return check; // Return to avoid checking anymore

                // Check for pawns
                if (colorInt === 0) {
                    if (squares[kingSquare + 7] && squares[kingSquare + 7].id === 22) return check = true;
                    if (squares[kingSquare + 9] && squares[kingSquare + 9].id === 22) return check = true;
                } else if (colorInt === 1) {
                    if (squares[kingSquare - 7] && squares[kingSquare - 7].id === 14) return check = true;
                    if (squares[kingSquare - 9] && squares[kingSquare - 9].id === 14) return check = true;
                };

                // Check for other pieces

                // N
                for (let i = kingSquare + 8; this.getFileRank(i).rank < 8; i += 8) {

                    if (!squares[i]) continue; // Empty, next square
                    
                    if (squares[i].colorInt === colorInt) {

                        break; // Own piece blocking
                    
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 5].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare + 8))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space above
                        check = true;
                        break;
                    };
                };

                if (check) return check;

                // S
                for (let i = kingSquare - 8; this.getFileRank(i).rank >= 0; i -= 8) {

                    if (!squares[i]) continue; // Empty, next square

                    if (squares[i].colorInt === colorInt) {

                        break; // Own piece blocking

                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 5].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare - 8))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                };

                if (check) return check;

                // E
                for (let i = kingSquare + 1; this.getFileRank(i).file > kingFileRank.file && this.getFileRank(i).rank < 8; i++) {

                    if (!squares[i]) continue; // Empty, next square.

                    if (squares[i].colorInt === colorInt) {
                        break; // Own piece blocking
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 5].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare + 1))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                };

                if (check) return check;

                // W
                for (let i = kingSquare - 1; this.getFileRank(i).file < kingFileRank.file && this.getFileRank(i).rank >= 0; i--) {

                    if (!squares[i]) continue; // Empty, next square.

                    if (squares[i].colorInt === colorInt) {
                        break; // Own piece blocking
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 5].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare - 1))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                };
                if (check) return check;

                // NW
                for (let i = kingSquare + 9; this.getFileRank(i).rank < 8 && this.getFileRank(i).file > kingFileRank.file; i += 9) {

                    if (!squares[i]) continue; // Empty, next square.

                    if (squares[i].colorInt === colorInt) {
                        break; // Own piece blocking
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 3].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare + 9))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                }

                if (check) return check;

                // SW
                for (let i = kingSquare - 7; this.getFileRank(i).rank >= 0 && this.getFileRank(i).file > kingFileRank.file; i -= 7) {

                    if (!squares[i]) continue; // Empty, next square.

                    if (squares[i].colorInt === colorInt) {
                        break; // Own piece blocking
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 3].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare - 7))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                }

                if (check) return check;

                // SE
                for (let i = kingSquare - 9; this.getFileRank(i).rank >= 0 && this.getFileRank(i).file < kingFileRank.file; i -= 9) {

                    if (!squares[i]) continue; // Empty, next square.

                    if (squares[i].colorInt === colorInt) {
                        break; // Own piece blocking
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 3].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare - 9))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                }

                if (check) return check;

                // NE
                for (let i = kingSquare + 7; this.getFileRank(i).rank < 8 && this.getFileRank(i).file < kingFileRank.file; i += 7) {

                    if (!squares[i]) continue; // Empty, next square.

                    if (squares[i].colorInt === colorInt) {
                        break; // Own piece blocking
                    } else if (squares[i].typeInt === 6 && squares[i].colorInt !== colorInt) {

                        break; // Pawn blocking (If the pawn is putting the king in check it would have already been found earlier and returned)

                    } else if (squares[i].colorInt !== colorInt && ([2, 3].includes(squares[i].typeInt) || (squares[i].typeInt === 1 && i === kingSquare + 7))) {
                        // If different color AND
                        // Either rook/queen OR king 1 space below
                        check = true;
                        break;
                    };
                }

                if (check) return check;

                return check;

            };

            checkMate(colorInt) {
                
                let check = true; // Assume check is true initially
                let newSquares;
                // Loop over every piece
                for (let i = 0; i < this.squares.length; i++) {
                    if (!this.squares[i] || this.squares[i].colorInt !== colorInt) continue; // Avoid checking empty/opponent squares

                    // Loop over each pieces
                    for (const targetSquare of this.legalSquares(i)) {

                        newSquares = [...this.squares];
                        newSquares[targetSquare] = newSquares[i];
                        newSquares[i] = null;
                        check = this.check(newSquares, colorInt);

                        if (!check) return check;
                    };
                };

                return check;

            }

            async move(startSquare, targetSquare, move = true) {

                const oldSquares = [...this.squares];
                const piece = this.squares[startSquare];

                let legalMoves = this.legalSquares(startSquare); let legal;

                // If target square is legal
                if (legalMoves.includes(targetSquare)) {

                    // Take En Passant
                    if (targetSquare === this.game.state.passant) {

                        let rank = Math.floor(targetSquare / 8);

                        if (rank === 2) { // Black takes White
                            this.squares[targetSquare + 8] = null
                        } else if (rank === 5) { // White takes Black
                            this.squares[targetSquare - 8] = null
                        };
                    };
                    
                    // Reset En Passant squares
                    this.game.state.passant = undefined;

                    // Check if en passant is possible
                    if (this.squares[startSquare].id % 8 === 6 && Math.abs(targetSquare - startSquare) === 16) {
                        
                        this.game.state.passant = this.squares[startSquare].colorInt ? startSquare - 8 : startSquare + 8;

                    };

                    // Halfmove Counter
                    if (this.squares[targetSquare] || this.squares[startSquare].typeInt === 6) {
                        this.game.state.halfMoves = 0;
                    } else {
                        this.game.state.halfMoves ++;
                    };

                    // Fullmove Counter
                    if (this.squares[startSquare].colorInt === 1) {
                        this.game.state.fullMoves ++;
                    };

                    // Check for Check
                    let newSquares = [...this.squares];
                    newSquares[targetSquare] = newSquares[startSquare];
                    newSquares[startSquare] = null;
                    let check = this.check(newSquares, this.squares[startSquare].colorInt);

                    if (check) return legal = false; // Stop here if check

                    // Move piece
                    if (move) {
                        this.squares[targetSquare] = this.squares[startSquare];
                        this.squares[startSquare] = null;
                        legal = true;
                    }

                    if (!legal) return legal; // Stop here if illegal

                    // Promotion
                    if (piece.id === 22 && this.getFileRank(targetSquare).rank === 0) {

                        // Check if there are any taken pieces that can be swapped
                        let swappable = [...new Set(this.takenPieces.black.filter(p => p !== 6))]; // This removes duplicates and filters out pawns
                        
                        if (swappable.length > 0) {
                            
                            let names = ['queen', 'bishop', 'knight', 'rook']
                            
                            // Neat trick to map current swappables by the name :D
                            await message.channel.send(`What would you like to promote to:\n**${swappable.map(p => names[p - 2].toUpperCase()).join(', ')}**`);

                            let promotionChoice;
                            
                            try {
                                
                                let filter = m => {
                                    return m.author.id === this.game.players[this.game.state.turn].member.id && swappable.map(p => names[p - 2]).includes(m.content.toLowerCase())
                                };

                                promotionChoice = names.indexOf((await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] })).first().content.toLowerCase()) + 2

                            } catch { // It will catch if time runs out, defaulting to the "most powerful" piece.
                                promotionChoice = swappable[0];
                            };

                            this.squares[targetSquare] = new Piece(16, promotionChoice)
                        };

                    } else

                    if (piece.id === 14 && this.getFileRank(targetSquare).rank === 7) {
                        
                        // Check if there are any taken pieces that can be swapped
                        let swappable = [...new Set(this.takenPieces.white.filter(p => p !== 6))]; // This removes duplicates and filters out pawns
                        
                        if (swappable.length > 0) {
                            
                            // Same as above, just for white
                            let names = ['queen', 'bishop', 'knight', 'rook']
                            await message.channel.send(`What would you like to promote to:\n**${swappable.map(p => names[p - 2].toUpperCase()).join(', ')}**`);

                            let promotionChoice;
                            
                            try {
                                let filter = m => {
                                    return m.author.id === this.game.players[this.game.state.turn].member.id && swappable.map(p => names[p - 2]).includes(m.content.toLowerCase())
                                };

                                promotionChoice = names.indexOf((await message.channel.awaitMessages(filter, { max: 1, time: 15000, errors: ['time'] })).first().content.toLowerCase()) + 2

                            } catch {
                                promotionChoice = swappable[0];
                            };

                            this.squares[targetSquare] = new Piece(8, promotionChoice);
                        };
                    }

                    // If move was castle, move rook
                    if (move && oldSquares[startSquare].typeInt === 1 && Math.abs(targetSquare - startSquare) === 2) {

                        let side = (targetSquare - startSquare)/Math.abs(targetSquare - startSquare);

                        if (side === 1) {
                            this.squares[startSquare + 1] = this.squares[startSquare + 3];
                            this.squares[startSquare + 3] = null;
                        } else if (side === -1) {
                            this.squares[startSquare - 1] = this.squares[startSquare - 4];
                            this.squares[startSquare - 4] = null;
                        }

                    }

                } else {
                    legal = false;
                };

                return legal;
            };

            genericSlidingLegalSquares(square, piece, directions, king = false) {

                // Directions can be anything from
                // []
                // to
                // ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

                let legalSquares = [];

                // North
                if (directions.includes('N')) {
                    for (let i = square + 8; i < this.squares.length; i += 8) {
                        if (!this.squares[i]) {
                            legalSquares.push(i)
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // North East
                if (directions.includes('NE')) {
                    for (let i = square + 9; i % 8 !== 0 && i < 64; i += 9) {
                        if (!this.squares[i]) {
                            legalSquares.push(i)
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // East
                if (directions.includes('E')) {
                    for (let i = square + 1; i < Math.ceil((square + 1)/8) * 8; i++) {
                        if (!this.squares[i]) {
                            legalSquares.push(i);
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // South East
                if (directions.includes('SE')) {
                    for (let i = square - 7; i % 8 !== 0 && i >= 0; i -= 7) {
                        if (!this.squares[i]) {
                            legalSquares.push(i)
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // South
                if (directions.includes('S')) {
                    for (let i = square - 8; i >= 0; i -= 8) {
                        if (!this.squares[i]) {
                            legalSquares.push(i)
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // South west
                if (directions.includes('SW')) {
                    for (let i = square - 9; i % 8 !== 8 && i >= 0; i -= 9) {
                        if (!this.squares[i]) {
                            legalSquares.push(i)
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // West
                if (directions.includes('W')) {
                    for (let i = square - 1; i >= Math.floor(square/8) * 8; i--) {
                        if (!this.squares[i]) {
                            legalSquares.push(i);
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                // North west
                if (directions.includes('NW')) {
                    for (let i = square + 7; i % 8 !== 8 && i < 64; i += 7) {
                        if (!this.squares[i]) {
                            legalSquares.push(i)
                        } else {
                            if (this.squares[i].color !== piece.color) legalSquares.push(i);
                            break;
                        };
                        if (king) break;
                    };
                };

                return legalSquares;

            };

            legalSquares(square) {

                    // This method checks a given square,
                    // And returns an array of all the squares
                    // the piece in that square could move to.

                let piece = this.squares[square];
                if (!piece) return [];

                let legalSquares = [];
                
                    // Different pieces have different moves, so using a switch statement to handle this.
                    // Probably a better way but im noob

                switch (piece.id % 8) {

                    case 1: // King
                        legalSquares = this.genericSlidingLegalSquares(square, piece, ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'], true);

                        // Castling
                        let castling = this.game.state.castling
                        if (piece.colorInt === 1) {

                            // Queenside
                            if (castling.black.queenside && !this.squares[square - 3] && !this.squares[square - 2] && !this.squares[square - 1]) {
                                
                                let newSquares = [...this.squares];
                                newSquares[square - 1] = newSquares[square];
                                newSquares[square] = null;

                                // Ensure the king does not pass through check, repeat for all.
                                if (!this.check(newSquares, piece.colorInt)) legalSquares.push(square - 2);
                            };

                            // Kingside
                            if (castling.black.kingside && !this.squares[square + 1] && !this.squares[square + 2]) {
                                
                                let newSquares = [...this.squares];
                                newSquares[square + 1] = newSquares[square];
                                newSquares[square] = null;

                                if (!this.check(newSquares, piece.colorInt)) legalSquares.push(square + 2);
                            };

                            
                        } else if (piece.colorInt === 0 && this.game.state.castling.white) {

                            // Queenside
                            if (castling.white.queenside && !this.squares[square - 3] && !this.squares[square - 2] && !this.squares[square - 1]) {
                                
                                let newSquares = [...this.squares];
                                newSquares[square - 1] = newSquares[square];
                                newSquares[square] = null;

                                if (!this.check(newSquares, piece.colorInt)) legalSquares.push(square - 2);
                            }

                            // Kingside
                            if (castling.white.kingside && !this.squares[square + 1] && !this.squares[square + 2]) {
                                
                                let newSquares = [...this.squares];
                                newSquares[square + 1] = newSquares[square];
                                newSquares[square] = null;

                                if (!this.check(newSquares, piece.colorInt)) legalSquares.push(square + 2);
                            };

                        };
                        break;

                    case 2: // Queen
                        legalSquares = this.genericSlidingLegalSquares(square, piece, ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'])
                        break;

                    case 3: // Bishop
                        legalSquares = this.genericSlidingLegalSquares(square, piece, ['NE', 'SE', 'SW', 'NW']);
                        break;

                    case 4: // Knight

                        // N 23, 25
                        // E 10, -6
                        // S -23, -25
                        // W -10, 6

                            // Split moves into left and right.

                        let movesL = [-17, -10, 6, 15];
                        let movesR = [-15, -6, 10, 17];

                        let current = this.getFileRank(square);

                        let target;

                        // For all the moves that go left
                        // check it doesnt loop around the left of the board.

                        movesL.forEach(m => {
                            target = this.getFileRank(square + m);

                            if (target.file < current.file && target.rank < 8 && target.rank >= 0) { // Check no loop & rank is within boundries.
                                if (!this.squares[square + m] || this.squares[square + m].colorInt !== piece.colorInt) { // Check its empty or different colour.
                                    legalSquares.push(square + m);
                                };
                            };
                        });
                        
                        // For all the moves that go right
                        // check it doesn't loop around the right of the board.

                        movesR.forEach(m => {
                            target = this.getFileRank(square + m);

                            if (target.file > current.file && target.rank < 8 && target.rank >= 0) { // Check no loop & rank is within boundries.
                                if (!this.squares[square + m] || this.squares[square + m].colorInt !== piece.colorInt) { // Check its empty or different colour.
                                    legalSquares.push(square + m);
                                };
                            };
                        });

                        break;

                    case 5: // Rook
                        legalSquares = (this.genericSlidingLegalSquares(square, piece, ['N', 'E', 'S', 'W']));
                        break;
                
                    case 6: // Pawn

                        if (piece.id > 16) { // If black, move down.

                            if (square < 8) return;

                            if (!this.squares[square - 8]) {
                                legalSquares.push(square - 8);
                                if (square/8 >= 6 && square/8 < 7 && !this.squares[square - 16]) legalSquares.push(square - 16);
                            };
                            
                            if (this.squares[square - 7]) {
                                if (this.squares[square - 7].color === 'white') legalSquares.push(square - 7)
                            } else {
                                if (this.game.state.passant === square - 7) legalSquares.push(square - 7);
                            };
                            if (this.squares[square - 9]) {
                                if (this.squares[square - 9].color === 'white') legalSquares.push(square - 9);
                            } else {
                                if (this.game.state.passant === square - 9) legalSquares.push(square - 9);
                            };                         

                        } else { // Else move up

                            if (square >= 56) return;

                            if (!this.squares[square + 8]) {
                                legalSquares.push(square + 8);
                                if (square/8 >= 1 && square/8 < 2 && !this.squares[square + 16]) legalSquares.push(square + 16);
                            };

                            if (this.squares[square + 7]) {
                                if (this.squares[square + 7].color === 'black') legalSquares.push(square + 7)
                            } else {
                                if (this.game.state.passant === square + 7) legalSquares.push(square + 7);
                            };
                            if (this.squares[square + 9]) {
                                if (this.squares[square + 9].color === 'black') legalSquares.push(square + 9);
                            } else {
                                if (this.game.state.passant === square + 9) legalSquares.push(square + 9);
                            };

                        }

                        break;
                        
                };

                return legalSquares;

            }
        };

        class Piece {

            constructor(color, type) {

                this.id = color + type;
                this.sprite = this._sprite();

            };

            get color() {
                return this.id > 16 ? 'black' : 'white';
            };

            get colorInt() {
                return this.id > 16 ? 1 : 0;
            }

            get type() {
                return ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'][this.id % 8 - 1]
            }

            get typeInt() {
                return this.id % 8;
            }

            get name() {
                return this.color + ' ' + this.type
            }

            _sprite() {

                let [x, y] = [this.id % 8 - 1, Math.floor(this.id/16)]

                    // Returns a canvas of the sprite for a piece
                    // x and y are the positions on the sprite sheet

                const canvas = createCanvas(128, 128);
                const ctx = canvas.getContext('2d');
                ctx.drawImage(sprite_sheet, x*170, y*170, 170, 170, 0, 0, canvas.width, canvas.height);

                return canvas;
            };

        };

        class Player {
            constructor(member, color) {
                this.member = member;
                this.color = ['w', 'b'].indexOf(color);
            }
        }

        class Game {

            constructor(members, fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {

                let split = fen.split(' ');

                this.board = new Board(this, split[0]);
                this.players = [new Player(members[0], 'w'), new Player(members[1], 'b')]

                this.state = {
                    turn: {'w': 0, 'b': 1}[split[1]],
                    castling: {
                        white: {
                            kingside: split[2].includes('K'),
                            queenside: split[2].includes('Q')
                        },
                        black: {
                            kingside: split[2].includes('k'),
                            queenside: split[2].includes('q')
                        }
                    },
                    passant: this.algToNumSquare(split[3]),
                    halfMoves: Number(split[4]),
                    fullMoves: Number(split[5])
                };

                    // "end" is the win condition
                    // 0 - In progress
                    // 1 - White wins
                    // 2 - Black wins
                    // 3 - Tie

                this.end = 0; 

            };

            get fen() {

                // FEN is separated by spaces, and so building the fen as an array and joining it with spaces seems good.
                let fen = [];

                // Using a dictionary for pieces, makes the most sense.
                const pieceTypeDict = {

                    1: 'k',
                    2: 'q',
                    3: 'b',
                    4: 'n',
                    5: 'r',
                    6: 'p'

                };

                // Initialising variables
                let fenBoard = []; let arr = []; let piece; let spaces = 0;

                // Start at the top rank, increment down by 1 each time.
                for (let rank = 7; rank >= 0; rank--) {
                    // Reset variables
                    spaces = 0; 
                    arr = [];

                    // Start at the leftmost file, incremement up from 0 to 7.
                    for (let file = 0; file < 8; file++) {

                        piece = this.board.squares[file + rank * 8];

                        if (piece) {
                            // Push current amount of spaces, if any
                            if (spaces) arr.push(spaces); spaces = 0;
                            // Append the correct notation. Using colorInt (0 or 1) to determine case.
                            arr.push(piece.colorInt ? pieceTypeDict[piece.typeInt] : pieceTypeDict[piece.typeInt].toUpperCase());
                        } else {
                            // Increment spaces
                            spaces++;
                        };

                    };
                    if (spaces) arr.push(spaces);
                    fenBoard.push(arr.join(''));

                };

                fen.push(fenBoard.join('/')); // Add rank breaks

                fen.push(['w', 'b'][this.state.turn]); // Add turn

                // Not sure if there's a better way of doing this, but here we are...
                let castling = [];
                if (this.state.castling.white.kingside) castling.push('K');
                if (this.state.castling.white.queenside) castling.push('Q');
                if (this.state.castling.black.kingside) castling.push('k');
                if (this.state.castling.black.queenside) castling.push('q');
                fen.push(castling.length > 0 ? castling.join('') : '-');

                // SImple use of premade functions
                fen.push(this.state.passant ? this.numToAlgSquare(this.state.passant) : '-');
                fen.push(this.state.halfMoves); fen.push(this.state.fullMoves);

                return fen.join(' ');

            };

            algToNumSquare(str) {
                let arr = str.toUpperCase().split("");
                let file = file_headers.indexOf(arr[0]);
                let rank = rank_headers.indexOf(arr[1]);

                if (file !== -1 && rank !== -1) {
                    return file + rank * 8;
                } else {
                    return undefined
                }
            };

            numToAlgSquare(num) {
                let file = num % 8;
                let rank = Math.floor(num / 8);

                return file_headers[file].toLowerCase() + rank_headers[rank];
            };

            updateCastling() {

                // White King
                if (!this.board.squares[4] || this.board.squares[4].id !== 9) {
                    this.state.castling.white = { queenside: false, kingside: false }
                }

                // White Queenside
                if (!this.board.squares[0] || this.board.squares[0].id !== 13) {
                    this.state.castling.white.queenside = false;
                };

                // White Kingside
                if (!this.board.squares[7] || this.board.squares[7].id !== 13) {
                    this.state.castling.white.kingside = false;
                };

                // Black King
                if (!this.board.squares[60] || this.board.squares[60].id !== 17) {
                    this.state.castling.black = { queenside: false, kingside: false }
                }

                // Black Queenside
                if (!this.board.squares[56] || this.board.squares[56].id !== 21) {
                    this.state.castling.black.queenside = false;
                };

                // Black Kingside
                if (!this.board.squares[63] || this.board.squares[63].id !== 21) {
                    this.state.castling.black.kingside = false;
                };

            };

            draw(turn) {

                // Function to draw the current chess board
    
                registerFont('./Assets/Fonts/bahnschrift-main.ttf', {family: 'impact'});
    
                const canvas = createCanvas(512, 512) // Create Canvas
                const ctx = canvas.getContext('2d');
    
                    // Creating the Board
                    // This should work for any size canvas.
                    // Non-square canvas will stretch the board.
    
                let [x, y] = [0, 0];
                let cell_size = canvas.width/8;
    
                for (let rank = 0; rank < 8; rank++) { // Loop for each row
    
                    for (let file = 0; file < 8; file++) { // Loop for each cell in row
    
                            // This determines the colour of the cell (proud I figured this ^^)
                            
                        ctx.fillStyle = (rank + file) % 2 ? '#F7F7F7' : '#7E7E7E' // '#7289DA' : '#202225';
                        ctx.fillRect(x, y, cell_size, cell_size);
    
                        x += cell_size; // Increment
                    };
                    y += cell_size; // Increment
                    x = 0 // Reset
                };

                    // Draw Pieces

                for (let rank = 0; rank < 8; rank++) { // Loop for each row

                    for (let file = 0; file < 8; file++) { // Loop for each cell in row

                        this.board.squares[rank * 8 + file] ? ctx.drawImage(this.board.squares[rank * 8 + file].sprite, file * cell_size, (7 - rank) * cell_size, cell_size, cell_size) : null; // Draw sprite if cell is taken up.

                    };
                };

                    // Add labels and borders
                    // New Canvas...

                const _canvas = createCanvas(9*canvas.width/8, 9*canvas.height/8)
                const _ctx = _canvas.getContext('2d');

                _ctx.strokeStyle = '#202225'; _ctx.lineWidth = canvas.width/100;
                _ctx.strokeRect(canvas.width/16, canvas.height/16, canvas.width, canvas.height);

                _ctx.drawImage(canvas, canvas.width/16, canvas.height/16, canvas.width, canvas.height);

                _ctx.textAlign = 'center';
                _ctx.font = `${canvas.height/18}px "impact"`
                _ctx.fillStyle = '#F7F7F7'

                let str = '';
                for (let yi = 0; yi < 8; yi++) {
                    str = file_headers[yi];

                    _ctx.strokeText(str, [yi + 1]*canvas.width/8, canvas.height/22);
                    _ctx.strokeText(str, [yi + 1]*canvas.width/8, canvas.height + canvas.height/18 + canvas.height/16);
                    _ctx.fillText(str, [yi + 1]*canvas.width/8, canvas.height/22);
                    _ctx.fillText(str, [yi + 1]*canvas.width/8, canvas.height + canvas.height/18 + canvas.height/16);
                };

                rank_headers.reverse();
                for (let xi = 0; xi < 8; xi++) {
                    str = rank_headers[xi];

                    _ctx.strokeText(str, canvas.width/32, canvas.height/48 + [xi + 1]*canvas.height/8);
                    _ctx.strokeText(str, 3*canvas.width/32 + canvas.width, canvas.height/48 + [xi + 1]*canvas.height/8);
                    _ctx.fillText(str, canvas.width/32, canvas.height/48 + [xi + 1]*canvas.height/8);
                    _ctx.fillText(str, 3*canvas.width/32 + canvas.width, canvas.height/48 + [xi + 1]*canvas.height/8);
                };
                rank_headers.reverse();

                const __canvas = createCanvas(5*_canvas.width/4, _canvas.height);
                const __ctx = __canvas.getContext('2d');

                __ctx.drawImage(_canvas, _canvas.width/8, 0, _canvas.width, _canvas.height);

                const takens = this.board.takenPieces;

                let spriteSizeW = takens.white.length <= 8 ? __canvas.height/8 : __canvas.height/takens.white.length;
                let spriteSizeB = takens.black.length <= 8 ? __canvas.height/8 : __canvas.height/takens.black.length;

                let yi = 0; let sprite;
                for (let typeInt of takens.white) {
                    sprite = new Piece(8, typeInt).sprite;
                    __ctx.drawImage(sprite, 15*__canvas.width/16 - spriteSizeW/2, yi, spriteSizeW, spriteSizeW)
                    yi += spriteSizeW
                };

                yi = 0;
                for (let typeInt of takens.black) {
                    sprite = new Piece(16, typeInt).sprite
                    __ctx.drawImage(sprite, __canvas.width/16 - spriteSizeB/2, yi, spriteSizeB, spriteSizeB)
                    yi += spriteSizeB
                }
    
                return __canvas.toBuffer();
            };

        };

        let game = new Game([message.member, args.opponent], args.fen ? args.fen : undefined);

        let response; let startSquare; let targetSquare; let validMove; let piece; let takenPiece;
        let lastMove = ''; let reason = '';

        while (!game.end) {

            validMove = false;

            await message.channel.send(`${game.players[game.state.turn].member} make a move.`, { files: [{attachment: game.draw(game.state.turn), name: 'board.png'}], embed: {
                title: 'CHESS',
                image: {
                    url: 'attachment://board.png'
                },
                color: ['#FEFEFE', '#000000'][game.state.turn],
                description: `${lastMove}\n\n${game.board.check(game.board.squares, game.state.turn) ? '**CHECK!**' : ''}`,
                footer: {
                    text: `Type 'quit' to save and quit • Halfmoves: ${game.state.halfMoves} | Fullmoves: ${game.state.fullMoves}`
                }
            }});

            while (!validMove) {

                try {
                    response = (await message.channel.awaitMessages(m => m.author.id === game.players[game.state.turn].member.id && (/^([a-h][1-8]){2}$/i.test(m.content) || m.content.toLowerCase() === 'quit'), {max: 1, time: 120000, errors: ['time']})).first().content;
                } catch (e) {
                    game.end = 2 - game.state.turn;
                    reason = 'time'
                    break;
                };

                if (response) {

                    if (response.toLowerCase() === 'quit') {
                        return message.channel.send({ embed: {
                            title: 'CHESS',
                            color: this.client.config.colors.red,
                            description: `${['◻️', '◼️'][game.state.turn]} •  ${game.players[game.state.turn].member} quit.\n\nYou can continue the game at any time using the FEN below.`,
                            fields: [
                                {name: 'FEN', value: `\`${game.fen}\``}
                            ]
                        }})
                    }

                    startSquare = game.algToNumSquare(response.slice(0, response.length/2));

                    if (game.board.squares[startSquare]) {

                        if (game.board.squares[startSquare].colorInt === game.players[game.state.turn].color) {
                                
                            targetSquare = game.algToNumSquare(response.slice(response.length/2));

                            if (startSquare >= 0 && startSquare < 64 && targetSquare >= 0 && targetSquare < 64) {

                                piece = game.board.squares[startSquare];

                                validMove = await game.board.move(startSquare, targetSquare);
                            };

                            if (validMove) { 

                                game.updateCastling();
                                lastMove = `${['◻️', '◼️'][game.state.turn]} • ${game.players[game.state.turn].member} moved **${piece.type.toUpperCase()}** from **${game.numToAlgSquare(startSquare).toUpperCase()}** to **${game.numToAlgSquare(targetSquare).toUpperCase()}**`

                            } else {
                                await message.channel.send('Illegal move.');
                            };
                        
                        } else {
                            await message.channel.send('This is not your piece.')
                        };
                    
                    } else {
                        await message.channel.send('There is no piece to be moved.')
                    };

                };

            };

            game.state.turn = 1 - game.state.turn;
                        
            // Checkmate
            if (game.board.checkMate(game.state.turn)) {

                game.end = 2 - game.state.turn;
                reason = 'checkmate'

            } else 

            if (game.state.halfMoves >= 50) {
                game.end = 3;
                reason = 'fifty-move rule'
            };

        };

        if (game.end === 3) { // Tie

            return message.channel.send({ files: [{ attachment: game.draw(), name: 'board.png' }], embed: {

                title: 'TIE',
                description: reason.toUpperCase(),
                color: this.client.config.colors.amber,
                image: {
                    url: 'attachment://board.png'
                },
                footer: {
                    text: `Halfmoves: ${game.state.halfMoves} | Fullmoves: ${game.state.fullMoves}`
                }

            }});
        
        } else { // For either win states

            return message.channel.send({ files: [{ attachment: game.draw(), name: 'board.png' }], embed: {
                
                title: `${['WHITE', 'BLACK'][game.end - 1]} WINS`,
                description: `\u200b\n${['◻️', '◼️'][game.end - 1]} •${game.players[game.end - 1].member} won by ${reason}`,
                fields: reason === 'time' ? {
                    name: 'FEN',
                    value: `\`${game.fen}\``
                } : [],
                color: this.client.config.colors.green,
                thumbnail: {
                    url: game.players[game.end - 1].member.user.displayAvatarURL()
                },
                image: {
                    url: 'attachment://board.png'
                },
                footer: {
                    text: `Halfmoves: ${game.state.halfMoves} | Fullmoves: ${game.state.fullMoves}`
                }

            }});
        };
    };
};

module.exports = ChessCommand;