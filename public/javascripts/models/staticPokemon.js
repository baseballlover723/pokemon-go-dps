function StaticPokemon(id, name, stamina, attack, defense, type1, type2, fastMoveIds, chargeMoveIds) {
  type2 == type2 || false;
  if (id instanceof Object) {
    // copy constructor needed to have functions work
    var other = id;
    this.id = other.id;
    this.name = other.name;
    this.stamina = other.stamina;
    this.attack = other.attack;
    this.defense = other.defense;
    this.type1 = other.type1;
    this.type2 = other.type2;
    this.fastMoveIds = other.fastMoveIds || other.fastMoves.map(function(m) {return m.id;});
    this.chargeMoveIds = other.chargeMoveIds || other.chargeMoves.map(function(m) {return m.id;});
  } else {
    this.id = id;
    this.name = name;
    this.stamina = stamina;
    this.attack = attack;
    this.defense = defense;
    this.type1 = type1;
    this.type2 = type2;
    this.fastMoveIds = fastMoveIds;
    this.chargeMoveIds = chargeMoveIds;
  }
}