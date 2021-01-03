const testLoader= (name, path) => {
    describe(name, () => require(path));
};

module.exports= testLoader;
