Array.prototype.asyncForEach = async (callback) => {
  for (let i = 0; i < this.length; i++) {
    await callback(this[i], i, this);
  }
};