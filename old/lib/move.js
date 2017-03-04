function Move(id, name) {
    var self = this;
    this.id = id;
    this.name = name;
    this.class = id >= 200 ? "Fast" : "Charge";
    this.damage = "Loading";
    this.duration = "Loading";
    this.type = "Loading";
    if (self.isFast()) {
        this.energyGain = "Loading";
    } else {
        this.energyRequired = "Loading";
        this.critChance = "Loading";
    }
}

Move.prototype = {
    isFast: function () {
        return this.class == "Fast";
    }, hasAnyLoading: function () {
        return this.damage == "Loading" || this.duration == "Loading" || this.type == "Loading" ||
            (this.isFast() && this.energyGain == "Loading") ||
            (!this.isFast() && (this.energyRequired == "Loading" || this.critChance == "Loading"));
    }, load: function (move) {
        this.class = move.class;
        this.damage = move.damage;
        this.duration = move.duration;
        this.type = move.type;
        if (this.isFast()) {
            this.energyGain = move.energyGain;
        } else {
            this.energyRequired = move.energyRequired;
            this.critChance = move.critChance;
        }
    }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Move;
}
