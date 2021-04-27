class Apparel {

    constructor(options = {}) {
        const {
            slot,
            resTypes = []
        } = options;

        this.slot = slot;
        this.resTypes = resTypes;
    }

};

module.exports = Apparel;