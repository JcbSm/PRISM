class Duel {

    constructor(fighters, channel, client) {

        this.fighters = fighters;
        this.channel = channel;
        this.client = client;

    }

    async * rounds () {

        let round = 0;

        while (true) {

            round ++;

            yield `Round ${round}: ${this.fighters[0].name}`
            
        }

    }

};

module.exports = Duel;