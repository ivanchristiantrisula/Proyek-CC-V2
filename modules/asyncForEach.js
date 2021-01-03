Array.prototype.asyncForEach = async function(callback, thisArg) {
	thisArg = thisArg || this;
	
	for (let i = 0, l = this.length; i !== l; ++i) {
		await callback.call(thisArg, this[i], i, this);
	}
};

module.exports= Array.prototype.asyncForEach;