const getAPIKey = () => {
    const alphabets= 'abcdefghijklmnopqrstuvwxyz'.split('');

    let key= '';

    for (let i= 0; i<10; i++) {
        let hash= Math.floor(Math.random()*2)+1;
        let model= Math.floor(Math.random()*2)+1;
        let randAlpha= Math.floor(Math.random()*alphabets.length);
        
        if (hash === 1) {
            key+= Math.floor(Math.random()*10);
        } else {
            if (model === 1) key+= alphabets[randAlpha].toUpperCase();
            else key+= alphabets[randAlpha]; 
        }
    }

    return key;
};

module.exports= getAPIKey;