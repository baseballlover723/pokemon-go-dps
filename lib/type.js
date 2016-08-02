function Type(name) {
    this.name = name;
    this.weaknesses = [];
    this.strengths = [];
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Type;
}