const thirdPartyAPI= require('../thirdPartyAPI');
const getAPIKey= require('../modules/getAPIKey');
const verifyToken= require('../modules/verifyToken');
const validateEmail= require('../modules/validateEmail');
const upload= require('../modules/upload');
const asyncForEach= require('../modules/asyncForEach');
const db= require('../database');
const Text2Speech = require("../modules/Text2Speech")
const path = require("path");

const express= require('express');
const jwt= require('jsonwebtoken');
const fetch= require('node-fetch');

const router= express.Router();

// /users/register
router.post('/users/register', async (req, res) => {
    const data= req.body;

    if (!data.email_users || !data.nama_users || !data.password_users) {
        return res.status(400).json({
            status: 400,
            message: 'Field tidak boleh kosong!'
        });
    }
    
    if (!validateEmail(data.email_users)) {
        return res.status(400).json({
            status: 400,
            message: 'E-mail tidak valid!'
        });
    }

    let query= await db.executeQuery(`
        SELECT * 
        FROM users
        WHERE email_users = '${data.email_users}'
    `);

    if (query.rows.length) {
        return res.status(409).json({
            status: 409,
            message: 'E-mail sudah digunakan.'
        });
    }

    query= await db.executeQuery(`
        INSERT INTO users (
            email_users, 
            nama_users, 
            password_users, 
            saldo_users, 
            tipe_users, 
            api_key, 
            api_hit
        ) VALUES (
            '${data.email_users}',
            '${data.nama_users}',
            '${data.password_users}',
            0,
            0,
            '${getAPIKey()}',
            100
        ) 
    `);

    if (query.rowCount === 0) {
        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan. Coba lagi.'
        });
    }

    return res.status(200).json({
        status: 200,
        message: 'Register berhasil!'
    });
});

// /users/login
router.post('/users/login', async (req, res) => {
    const data= req.body;

    if (!data.email_users || !data.password_users) {
        return res.status(400).json({
            status: 400,
            message: 'Field tidak boleh kosong!'
        });
    }
    
    let query= await db.executeQuery(`
        SELECT * 
        FROM users
        WHERE email_users = '${data.email_users}' AND
              password_users = '${data.password_users}'
    `);

    if (!query.rows.length) {
        return res.status(404).json({
            status: 404,
            message: 'E-mail atau password tidak ditemukan.'
        });
    }

    const token= jwt.sign({
        id_users: query.rows[0].id_users,
        email_users: query.rows[0].email_users.trim(),
        tipe_users: query.rows[0].tipe_users
    }, 'corona');

    return res.status(200).json({
        status: 200,
        message: 'Login berhasil.',
        token: token
    });
});

// /users/profile
router.get('/users/profile', async (req, res) => {
    const token= req.header('x-access-token');
    const verified= verifyToken(token);

    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }

    let query= await db.executeQuery(`
        SELECT *
        FROM users
        WHERE email_users = '${verified.email_users}'
    `);

    if (!query.rows.length) {
        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan. Coba lagi.'
        });
    }

    return res.status(200).json({
        status: 200,
        profile: query.rows[0]
    });
});

// /users/profile
router.put('/users/profile', upload('./uploads', 'gambar_users'), async (req, res) => {
    const token= req.header('x-access-token');
    const data= req.body;
    const verified= verifyToken(token);

    data.file= req.file ? req.file.originalname : 'default.png';

    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }

    if (!data.nama_users || !data.old_password_users || 
        !data.confirm_password_users || !data.new_password_users) {
        return res.status(400).json({
            status: 400,
            message: 'Field tidak boleh kosong!'
        });
    }   

    if (data.new_password_users !== data.confirm_password_users) {
        return res.status(400).json({
            status: 400,
            message: 'Password baru tidak sama dengan confirm password.'
        });
    }

    let query= await db.executeQuery(`
        SELECT *
        FROM users
        WHERE email_users = '${verified.email_users}' AND
              password_users = '${data.old_password_users}'
    `);

    if (!query.rows.length) {
        return res.status(400).json({
            status: 400,
            message: 'Password lama tidak sesuai.'
        });
    }

    query= await db.executeQuery(`
        UPDATE users
        SET nama_users = '${data.nama_users}', gambar_users = '${data.file}', password_users = '${data.new_password_users}'
        WHERE email_users = '${verified.email_users}'
    `);
    
    if (query.rowCount === 0) {
        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan. Coba lagi.'
        });
    }

    return res.status(200).json({
        status: 200,
        message: 'Ubah profile berhasil!'
    });
});

// /users/topUp
router.post('/users/topUp', async (req, res) => {
    const token= req.header('x-access-token');
    const data= req.body;
    const verified= verifyToken(token);

    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }

    if (!data.email_users || !data.jumlah_topup) {
        return res.status(400).json({
            status: 400,
            message: 'Field tidak boleh kosong!'
        });
    }
    
    if (verified.email_users !== data.email_users) {
        return res.status(400).json({
            status: 400,
            message: 'E-mail tidak cocok!'
        });
    }

    if (parseInt(data.jumlah_topup) <= 0) {
        return res.status(400).json({
            status: 400,
            message: 'Jumlah top up tidak valid!'
        });
    }
    
    let query= await db.executeQuery(`
        UPDATE users
        SET saldo_users = saldo_users + ${parseInt(data.jumlah_topup)}
        WHERE email_users = '${data.email_users}'
    `);

    if (query.rowCount === 0) {
        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan. Coba lagi.'
        });
    }

    return res.status(200).json({
        status: 200,
        message: 'Top up berhasil!'
    });
});

// /users/subscribe
router.post('/users/subscribe', async (req, res) => {
    const token= req.header('x-access-token');
    const data= req.body;
    const verified= verifyToken(token);

    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }

    if (!data.email_users || !data.jumlah_hit) {
        return res.status(400).json({
            status: 400,
            message: 'Field tidak boleh kosong!'
        });
    }

    if (verified.email_users !== data.email_users) {
        return res.status(400).json({
            status: 400,
            message: 'E-mail tidak cocok!'
        });
    }

    if (parseInt(data.jumlah_hit) <= 0) {
        return res.status(400).json({
            status: 400,
            message: 'Jumlah hit tidak valid!'
        });
    }

    let query= await db.executeQuery(`
        SELECT *
        FROM users
        WHERE email_users = '${data.email_users}'
    `);

    if (query.rows[0].saldo_users < 50*parseInt(data.jumlah_hit)) {
        return res.status(400).json({
            status: 400,
            message: 'Saldo tidak mencukupi.'
        });
    }

    query= await db.executeQuery(`
        UPDATE users
        SET saldo_users = saldo_users - ${50*parseInt(data.jumlah_hit)}, api_hit = api_hit + ${parseInt(data.jumlah_hit)}
        WHERE email_users = '${data.email_users}'
    `);

    if (query.rowCount === 0) {
        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan. Coba lagi.'
        });
    }

    return res.status(200).json({
        status: 200,
        message: 'Subscribe API hit berhasil!'
    });
});

// /users/getPremium
router.put('/users/getPremium', async (req, res) => {
    const token= req.header('x-access-token');
    const data= req.body;
    const verified= verifyToken(token);

    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    
    if (!data.email_users) {
        return res.status(400).json({
            status: 400,
            message: 'Field tidak boleh kosong!'
        });
    }

    if (verified.email_users !== data.email_users) {
        return res.status(400).json({
            status: 400,
            message: 'E-mail tidak cocok!'
        });
    }

    let query= await db.executeQuery(`
        SELECT *
        FROM users
        WHERE email_users = '${data.email_users}'
    `);

    if (query.rows[0].tipe_users === 1) {
        return res.status(400).json({
            status: 400,
            message: 'Sudah menjadi akun premium.'
        });
    }

    if (query.rows[0].saldo_users < 200000) {
        return res.status(400).json({
            status: 400,
            message: 'Saldo tidak mencukupi.'
        });
    }

    query= await db.executeQuery(`
        UPDATE users
        SET saldo_users = saldo_users - ${200000}, tipe_users = 1
        WHERE email_users = '${data.email_users}'
    `);

    if (query.rowCount === 0) {
        return res.status(500).json({
            status: 500,
            message: 'Terjadi kesalahan. Coba lagi.'
        });
    }

    return res.status(200).json({
        status: 200,
        message: 'Get premium akun berhasil!'
    });
});

// /recipes/search
router.get('/recipes/search', async(req, res) => {
    //const token= req.header('x-access-token');
    //const verified= verifyToken(token);

    // if (!verified.id_users) {
    //     return res.status(verified.status).json(verified);
    // }

    // if (!req.query.key || !req.query.query) {
    //     return res.status(401).json({
    //         status: 401,
    //         message: 'Parameter key dan query tidak boleh kosong.'
    //     });
    // }

    // let query= await db.executeQuery(`
    //     SELECT *
    //     FROM users
    //     WHERE api_key = '${req.query.key}'
    // `);

    // if (!query.rows.length) {
    //     return res.status(401).json({
    //         status: 401,
    //         message: 'Anda tidak memiliki akses.'
    //     });
    // } 
    
    // if (query.rows[0].api_hit === 0) {
    //     return res.status(401).json({
    //         status: 401,
    //         message: 'API hit habis.'
    //     });
    // }

    let results= [];
    let fetchAPI= await fetch(`
        ${thirdPartyAPI.host}/search?apiKey=${thirdPartyAPI.api_key}&query=${req.query.query}&number=${req.query.limit}`
    );
    let recipes= await fetchAPI.json();
    
    await recipes.results.asyncForEach(async item => {
        query= await db.executeQuery(`
            SELECT *
            FROM recipes
            WHERE id_recipes = ${item.id}
        `);

        if (!query.rows.length) {
            fetchAPI= await fetch(`
                ${thirdPartyAPI.host}/${item.id}/information?apiKey=${thirdPartyAPI.api_key}&includeNutrition=false
            `);
            let informations= await fetchAPI.json();
            let instructions= [];

            informations.extendedIngredients= informations.extendedIngredients.map(i => i.original);
            
            if (informations.analyzedInstructions.length) {
                instructions= informations.analyzedInstructions[0].steps.map(i => i.step);
            }

            results.push({
                id_recipes: informations.id,
                nama_recipes: informations.title.replace(/["']/g, ""),
                deskripsi_recipes: informations.summary.replace(/["']/g, ""),
                bahan_recipes: informations.extendedIngredients,
                instruksi_recipes: instructions
            });

            query= await db.executeQuery(`
                INSERT INTO recipes (
                    id_recipes,
                    nama_recipes,
                    deskripsi_recipes,
                    bahan_recipes,
                    instruksi_recipes
                ) VALUES (
                    ${informations.id},
                    '${informations.title.replace(/["']/g, "")}',
                    '${informations.summary.replace(/["']/g, "")}',
                    '${informations.extendedIngredients.join(', ').replace(/["']/g, "")}',
                    '${instructions.join(', ').replace(/["']/g, "")}'
                ) 
            `);
        } else {
            results.push({
                id_recipes: query.rows[0].id_recipes,
                nama_recipes: query.rows[0].nama_recipes,
                deskripsi_recipes: query.rows[0].deskripsi_recipes,
                bahan_recipes: query.rows[0].bahan_recipes.split(', '),
                instruksi_recipes: query.rows[0].instruksi_recipes.split(', '),
            });
        }
    });

    query= await db.executeQuery(`
        UPDATE users
        SET api_hit = api_hit - 1
        WHERE api_key = '${req.query.key}'
    `);

    let textTTS = "";
    results.forEach(element => {
        textTTS+=element.nama_recipes+" Ingridients : "+element.bahan_recipes+" How to cook : "+element.instruksi_recipes;
    });
    console.log(textTTS);
    let ttsFileName = Math.floor(new Date().getTime() / 1000)+".mp3";

    let setting = {
        "audioConfig": {
        "audioEncoding": "LINEAR16",
        "pitch": 0,
        "speakingRate": 1.00
        },
        "input": {
        "text": textTTS
        },
        "voice": {
        "languageCode": "en-US",
        "name": "en-US-Wavenet-F"
        },
        "outputFileName": ttsFileName
    }
    await Text2Speech(setting);

    return res.status(200).json({
        status: 200,
        message: 'Pencarian berhasil.',
        recipes: results,
        tts: 'https://8080-cs-237213409382-default.asia-southeast1.cloudshell.dev/api/download?file='+ttsFileName
    });
});

//BUAT TEST
router.get('/users', async (req, res) => {
    let query= await db.executeQuery(`
        SELECT *
        FROM users
    `);

    return res.status(200).json({
        status: 200,
        user: query.rows
    });
});



router.put('/users/:email_users', async (req, res) => {
    const data= req.body;
    
    let update= '';

    if (data.api_hit) {
        if (parseInt(data.api_hit) === -1) {
            update= 'SET api_hit = 0';
        } else {
            update= `SET api_hit = api_hit + ${parseInt(data.api_hit)}`;
        }
    }
    
    if (data.saldo_users) {
        if (parseInt(data.saldo_users) === -1) {
            update+= update === '' ? `SET saldo_users = 0` : `, saldo_users = 0`;
        } else {
            update+= update === '' ? 
                `SET saldo_users = saldo_users + ${parseInt(data.saldo_users)}` 
            : `, saldo_users = saldo_users + ${parseInt(data.saldo_users)}`;
        }
    }

    if (data.tipe_users) {
        if (parseInt(data.tipe_users) === -1) {
            update+= update === '' ? `SET tipe_users = 0` : `, tipe_users = 0`;
        } else {
            update+= update === '' ? `SET tipe_users = 1` : `, tipe_users = 1`;
        }
    }

    let query= await db.executeQuery(`
        UPDATE users
        ${update}
        WHERE email_users = '${req.params.email_users}'
    `);

    return res.status(200).json({
        status: 200,
        email_users: req.params.email_users
    })
});

router.get('/download', async (req, res) => {
    let fileName = req.query.file;
    res.sendFile(fileName, { root: path.join(__dirname, '../public/') });
});

router.delete('/users/:email_users', async (req, res) => {
    let query= await db.executeQuery(`
        DELETE FROM users 
        WHERE email_users = '${req.params.email_users}'
    `);

    return res.status(200).json({
        status: 200,
        email_users: req.params.email_users
    });
});

router.get('/recipes', async (req, res) => {
    let query= await db.executeQuery(`
        SELECT *
        FROM recipes
    `);

    return res.status(200).json({
        status: 200,
        user: query.rows
    });
});



module.exports= router;