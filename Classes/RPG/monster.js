class Monster {

    constructor(name, options = {} ) {

        const  {

            level = 1,
            baseHP = 1,
            def = 0,
            spd = 0,
            str = 0,
            weapons = [],
            apparel = [],
            activeEffects = []

        } = options;

        this.level = level;
        this.name = name;
        this.hp = baseHP * level;
        this.def = def;
        this.spd = spd;
        this.str = str;
        this.weapons = weapons;
        this.apparel = apparel;
        this.activeEffects = activeEffects;

    }

};

module.exports = Monster;