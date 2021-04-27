const Armour = require('../armour');
const Monster = require('../monster');
const Weapon = require('../weapon');

class Clarence extends Monster {

    constructor(options = {}) {

        const {
            level = 1,
        } = options;

        super('Clarence', {

            baseHP: 10,
            str: 1,
            weapons: [new Weapon({
                typeID: 1,
                materialID: 1
            })],
            apparel: [new Armour({
                typeID: 1,
                materialID: 1
            })],
            level: level

        });

    }
};

module.exports = Clarence;