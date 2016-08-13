var SUPER_EFFECTIVE = 1.25;
var NOT_EVFFECTIVE = 0.8;

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

Type.prototype = {
    hello: function() {
        console.log(this.name + " says hello");
    },
    getModifier: function (type) {
        if (this.weaknesses.indexOf(type) >= 0) {
            return NOT_EVFFECTIVE;
        } else if (this.strengths.indexOf(type) >= 0) {
            return SUPER_EFFECTIVE;
        } else {
            return 1;
        }
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Type;
}