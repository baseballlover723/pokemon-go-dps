var models = require("../models");
var sequelize = models.sequelize;
var Type = models.Type;
var FastMove = models.FastMove;
var ChargeMove = models.ChargeMove;
var Pokemon = models.Pokemon;
var GameMaster = models.GameMaster;

module.exports = {
  getTypes: getTypes,
  getFastMoves: getFastMoves,
  getChargeMoves: getChargeMoves,
  getPokemons: getPokemons,
  getSuperEffectiveModifier: getSuperEffectiveModifier,
  getStabModifier: getStabModifier
};

function getTypes(callback) {
  callback = callback || function(err, types) {};
  Type.findAll({
    include: [{model: Type, as: 'weaknesses'}, {model: Type, as: 'strengths'}],
    order: [['id', 'ASC']]
  }).then(function(types) {
    callback(null, types);
  }, function(err) {
    callback(err);
  });
}

function getFastMoves(callback) {
  callback = callback || function(err, fastMoves) {};
  FastMove.findAll({order: [['id', 'ASC']]}).then(function(fastMoves) {
    callback(null, fastMoves);
  }, function(err) {
    callback(err);
  });
}

function getChargeMoves(callback) {
  callback = callback || function(err, chargeMoves) {};
  ChargeMove.findAll({order: [['id', 'ASC']]}).then(function(chargeMoves) {
    callback(null, chargeMoves);
  }, function(err) {
    callback(err);
  });
}

function getPokemons(callback) {
  callback = callback || function(err, pokemons) {};
  Pokemon.findAll({
    include: [{model: FastMove, as: 'fastMoves', attributes: ['id']}, {model: ChargeMove, as: 'chargeMoves', attributes: ['id']}],
    order: [['id', 'ASC']]
  }).then(function(pokemons) {
    callback(null, pokemons);
  }, function(err) {
    callback(err);
  });
}

function getSuperEffectiveModifier(callback) {
  callback = callback || function(err, types) {};
  GameMaster.findOne({attributes: ['superEffectiveModifier'], limit: 1, order: [['updatedAt', 'DESC']]}).then(function(gameMaster) {
    callback(null, gameMaster.superEffectiveModifier);
  }, function(err) {
    callback(err);
  });
}

function getStabModifier(callback) {
  callback = callback || function(err, types) {};
  GameMaster.findOne({attributes: ['stabModifier'], limit: 1, order: [['updatedAt', 'DESC']]}).then(function(gameMaster) {
    callback(null, gameMaster.stabModifier);
  }, function(err) {
    callback(err);
  });

}
