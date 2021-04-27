class Player {

    constructor(member, options = {}) {

        const  {

            hp = 1,
            def = 1,
            spd = 1,
            str = 1,
            weapons = [],
            armour = [],

        } = options;

        this.member = member;
        this.hp = hp;
        this.def = def;
        this.spd = spd;
        this.str = str;
        this.weapons = weapons;
        this.armour = armour;

    };

    get alive() {
        if(this.hp > 0) {
            return true
        } else {
            return false
        }
    }

    get name() {
        return this.member.displayName
    }

    get atk() {
        
    }

    attack() {
    };

    defend() {
    };

    surrender() {
    };

}

module.exports = Player;