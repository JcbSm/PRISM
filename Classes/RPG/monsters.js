const Monster = require('./monster');
const Armour = require('./armour');
const Weapon = require('./weapon');
const Apparel = require('./apparel');

class Clarence extends Monster {

    constructor(options = {}) {

        const {
            level = 1,
            weapons = [new Weapon({
                typeID: 1,
                materialID: 1
            })],
            apparel = [new Armour({
                typeID: 1,
                materialID: 1
            })],
        } = options;

        super('Clarence', {

            baseHP: 10,
            str: 1,
            weapons: weapons,
            apparel: apparel,
            level: level

        });

    }
};

class Bandit extends Monster {
    constructor(options = {}) {

        const {
            level = 2,
            weapons = [
                new Weapon({
                    typeID: 1,
                    materialID: 2
                }),
                new Weapon({
                    typeID: 1,
                    materialID: 2
                })
            ],
            apparel = [
                new Armour({
                    typeID: 2,
                    materialID: 2
                })
            ]
        } = options

        super('Bandit', {
            level: level,
            baseHP: 20,
            str: 2,
            weapons: weapons,
            apparel: apparel
        })
    }
}

module.exports = { 
    Clarence,
    Bandit
};