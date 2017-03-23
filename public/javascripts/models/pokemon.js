var STAB = 1.25;
// initially set from the game master file once the table loads
var CALCULATE_CRIT = false;
var CHARGE_DELAY = 0.5;

function Pokemon(id, name, fastMove, chargeMove, stamina, attack, defense, type1, type2) {
  type2 == type2 || false;
  if (id instanceof Object) {
    // copy constructor needed to have functions work
    var other = id;
    this.id = other.id;
    this.name = other.name;
    if (!(other instanceof StaticPokemon)) {
      this.fastMove = other.fastMove;
      this.chargeMove = other.chargeMove;
    }
    this.stamina = other.stamina;
    this.attack = other.attack;
    this.defense = other.defense;
    this.type1 = other.type1;
    this.type2 = other.type2;
  } else {
    this.id = id;
    this.name = name;
    this.fastMove = fastMove;
    this.chargeMove = chargeMove;
    this.stamina = stamina;
    this.attack = attack;
    this.defense = defense;
    this.type1 = type1;
    this.type2 = type2;
  }
}

Pokemon.prototype = {
  getSTABDamage: function (move) {
    if (move.type.name == this.type1.name || move.type.name == this.type2.name) {
      return move.damage * STAB;
    } else {
      return move.damage;
    }
  },

  calculateFastMoveDPS: function (options) {
    var fmDamage = options.stab ? this.getSTABDamage(this.fastMove) : this.fastMove.damage;
    fmDamage *= this.fastMove.type.getModifierAgainstDefenders();
    return fmDamage / this.fastMove.duration;
  },

  calculateChargeMoveDPS: function (options) {
    var chargeDelay = options.chargeDelay ? CHARGE_DELAY : 0;
    var cmDamage = options.stab ? this.getSTABDamage(this.chargeMove) : this.chargeMove.damage;
    cmDamage *= this.chargeMove.type.getModifierAgainstDefenders();
    var critChance = CALCULATE_CRIT ? this.chargeMove.critChance : 0;
    return cmDamage * (critChance / 2 + 1) / (this.chargeMove.duration + chargeDelay);
  },

  calculateDPS: function (options) {
    if (this.shouldUseChargeMove(options)) {
      return (this.calculateFastMoveDamage(options) + this.calculateChargeMoveDamage(options)) /
        (this.calculateFastMoveDuration() + this.chargeMove.duration + CHARGE_DELAY);
    } else {
      return this.calculateFastMoveDPS(options);
    }
  },

  shouldUseChargeMove: function (options) {
    var fastDPS = this.calculateFastMoveDamage(options) / this.calculateFastMoveDuration();
    var chargeDPS = this.calculateChargeMoveDamage(options) / this.chargeMove.duration;
    return chargeDPS > fastDPS;
  },

  // calculateDPSOld: function (stab) {
  //     var fm = this.fastMove;
  //     var cm = this.chargeMove;
  //     var fmDamage = stab ? this.getSTABDamage(fm) : fm.damage;
  //     fmDamage *= getTypeModifier(fm);
  //     var cmDamage = stab ? this.getSTABDamage(cm) : cm.damage;
  //     cmDamage *= getTypeModifier(cm);
  //     var critChance = CALCULATE_CRIT ? cm.critChance : 0;
  //     return ((cm.energyRequired * fmDamage / fm.energyGain) + (cmDamage * (1 + critChance / 2))) /
  //         ((cm.energyRequired * fm.duration / fm.energyGain) + cm.duration + 0.5);
  // },

  calculateFastMoveDamage: function (options) {
    var fmDamage = options.stab ? this.getSTABDamage(this.fastMove) : this.fastMove.damage;
    fmDamage *= this.fastMove.type.getModifierAgainstDefenders();
    return (this.chargeMove.energyRequired * fmDamage / this.fastMove.energyGain);
  },

  calculateChargeMoveDamage: function (options) {
    var cmDamage = options.stab ? this.getSTABDamage(this.chargeMove) : this.chargeMove.damage;
    cmDamage *= this.chargeMove.type.getModifierAgainstDefenders();
    var critChance = CALCULATE_CRIT ? this.chargeMove.critChance : 0;
    return (cmDamage * (1 + critChance / 2));
  },

  calculateFastMoveDuration: function () {
    return (this.chargeMove.energyRequired * this.fastMove.duration / this.fastMove.energyGain);
  },

  calculateChargeMoveDamagePercent: function (options) {
    if (this.shouldUseChargeMove(options)) {
      return 100 * this.calculateChargeMoveDamage(options) / (this.calculateFastMoveDamage(options) + this.calculateChargeMoveDamage(options));
    } else {
      return 0; // doesn't use charge move
    }
  },

  calculateCycleDuration: function () {
    if (this.shouldUseChargeMove({stab: true})) {
      return this.calculateFastMoveDuration() + this.chargeMove.duration + 0.5;
    } else {
      return this.fastMove.duration;
    }
  }
};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Pokemon;
}
