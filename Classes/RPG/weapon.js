const types = require('./Weapons/types.json');
const materials = require('./Weapons/materials.json');

class Weapon {

    constructor(options = {}) {

        const {

            dmgTypes = [],
            name = '',
            typeID,
            materialID
            
        } = options;
        console.log(!typeID)
        this.dmgTypes = dmgTypes;
        this.type = typeID ? types.find(t => t.id === typeID) : this.randType();
        this.material = materialID ? materials.filter(m => m.classes.includes(this.type.class)).find(m => m.id === materialID) : this.randMaterial();
        this.name = name === '' ? this.randName() : name;

    }
    
    get weight() {
        return Math.round(this.type.weight * this.material.weight);
    }

    get dmg() {
        return Math.round(this.type.dmg * this.material.dmg);
    }

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

        if (this.dmgTypes.length > 0) {
            nameArr.push(`of ${this.dmgTypes[0]}`)
        }

        return nameArr.join(" ");
    }

}

module.exports = Weapon;