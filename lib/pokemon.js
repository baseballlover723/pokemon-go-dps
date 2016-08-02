var STAB = 1.25;

function Pokemon(id, name, fastMove, chargeMove, type1, type2 = false) {
    if (id instanceof Object) {
        // copy constructor needed to have functions work
        var other = id;
        this.id = other.id;
        this.name = other.name;
        this.fastMove = other.fastMove;
        this.chargeMove = other.chargeMove;
        this.type1 = other.type1;
        this.type2 = other.type2;
    } else {
        this.id = id;
        this.name = name;
        this.fastMove = fastMove;
        this.chargeMove = chargeMove;
        this.type1 = type1;
        this.type2 = type2;
    }
}

Pokemon.prototype = {
    getSTABDamage: function (move) {
        if (move.type.name == this.type1 || move.type.name == this.type2) {
            return move.damage * STAB;
        } else {
            return move.damage;
        }
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Pokemon;
}
