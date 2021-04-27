const Apparel = require("./apparel");
const types = require('./Apparel/Armour/types.json');
const materials = require('./Apparel/Armour/materials.json');


class Armour extends Apparel {

    constructor(options = {}) {

        const {
            resTypes = [],
            name = '',
            typeID,
            materialID
        } = options;

        super({slot: 2, resTypes: resTypes})

        this.type = typeID ? types.find(t => t.id === typeID) : this.randType();
        this.material = materialID ? materials.filter(m => m.classes.includes(this.type.class)).find(m => m.id === materialID) : this.randMaterial();
        this.name = name === '' ? this.randName() : name;

    }

    get weight() {
        return Math.round(this.type.weight * this.material.weight);
    };

    get def() {
        return Math.round(this.type.def * this.material.def);
    };

    randType() {
        
        return types[Math.floor(Math.random()*types.length)]
    };

    randMaterial() {
        let mats = materials.filter(m => m.classes.includes(this.type.class));
        return mats[Math.floor(Math.random()*mats.length)]
    };

    randName() {

        const nameArr = [];

        nameArr.push(this.material.name); nameArr.push(this.type.name)

        if (this.resTypes.length > 0) {
            nameArr.push(`of ${this.resTypes[0]}`)
        }

        return nameArr.join(" ");

    };

};

module.exports = Armour;