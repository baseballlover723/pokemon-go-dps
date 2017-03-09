function FastMove(data) {
  this.id = data.id;
  this.name = data.name;
  this.damage = data.damage;
  this.duration = data.duration > 100 ? data.duration / 1000 : data.duration;
  this.type = data.type;
  this.energyGain = data.energyGain;
}

FastMove.prototype = {
  isFast: function() {
    return true;
  }
};
