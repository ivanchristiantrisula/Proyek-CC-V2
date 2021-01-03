const jwt= require('jsonwebtoken');

const verifiyToken= (token, authorize) => {
    let user= {};

    if (!token) {
        return {
            status: 401,
            message: 'Token tidak ditemukan.'
        };
    }

    try {
        user= jwt.verify(token, 'corona');
    } catch (error) {
        return {
            status: 401,
            message: 'Token tidak valid.'
        };
    }

    if ((new Date().getTime()/1000) - user.iat > 3600) {
        return {
            status: 400,
            message: 'Token kadaluarsa.'
        };
    }

    if (authorize) {
        if (user.tipe_users !== 1) {
            return {
                status: 401,
                message: 'Anda tidak memiliki akses untuk fitur ini.'
            };
        }
    }

    return user;
};

module.exports= verifiyToken;