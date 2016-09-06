var SUPER_EFFECTIVE = 1.25;
var NOT_EFFECTIVE = 0.8;

function Type(name) {
    if (name instanceof Object) {
        var other = name;
        this.name = other.name;
        this.weaknesses = other.weaknesses;
        this.strengths = other.strengths;
        this.prototype = Type.prototype;
    } else {
        this.name = name;
        this.weaknesses = [];
        this.strengths = [];
    }
}

Type.typeModifiers = {}; // populated when static pokemon are loaded
// updated when calculateModifier is calculated, will calculated for all types at a time.
// doesn't calculate here, since it doesn't have a list of all the type objects

Type.prototype = {
    getModifier: function (type) {
        if (this.weaknesses.indexOf(type) >= 0) {
            return NOT_EFFECTIVE;
        } else if (this.strengths.indexOf(type) >= 0) {
            return SUPER_EFFECTIVE;
        } else {
            return 1;
        }
    },

    calculateModifier: function (defenders) {
        var modifier = 1;
        var count = 0;
        for (var defender in  defenders) {
            defender = defenders[defender];
            modifier *= this.getModifier(defender.type1) * 20; // to deal with integers
            count++;
            if (defender.type2) {
                modifier *= this.getModifier(defender.type2) * 20; // to deal with integers
                count++;
            }
        }
        Type.typeModifiers[this.name] = modifier / Math.pow(20, count);
    },

    getModifierAgainstDefenders: function() {
        return Type.typeModifiers[this.name];
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Type;
}