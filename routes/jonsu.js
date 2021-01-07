const thirdPartyAPI= require('../thirdPartyAPI');
const getAPIKey= require('../modules/getAPIKey');
const verifyToken= require('../modules/verifyToken');
const validateEmail= require('../modules/validateEmail');
const upload= require('../modules/upload');
const asyncForEach= require('../modules/asyncForEach');
const Text2Speech = require("../modules/Text2Speech");
const db= require('../database');
const {Translate} = require('@google-cloud/translate').v2;
const config = require("../config");

const express= require('express');
const jwt= require('jsonwebtoken');
const fetch= require('node-fetch');
const path = require("path");

const translate = new Translate(config);

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

// /recipes/search
router.get('/recipes/search', async(req, res) => {
    const token= req.header('x-access-token');
    const verified= verifyToken(token);

    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }

    if (!req.query.key || !req.query.query) {
        return res.status(401).json({
            status: 401,
            message: 'Parameter key dan query tidak boleh kosong.'
        });
    }

    let query= await db.executeQuery(`
        SELECT *
        FROM users
        WHERE api_key = '${req.query.key}'
    `);

    if (!query.rows.length) {
        return res.status(401).json({
            status: 401,
            message: 'Anda tidak memiliki akses.'
        });
    } 
    
    // if (query.rows[0].api_hit === 0) {
    //     return res.status(401).json({
    //         status: 401,
    //         message: 'API hit habis.'
    //     });
    // }

    let results= [];
   
    let apiInfo = await thirdPartyAPI.APIInfo();
    let fetchAPI= await fetch(`
        ${apiInfo.host}/search?apiKey=${apiInfo.api_key}&query=${req.query.query}&number=${req.query.limit}`
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
                ${apiInfo.host}/${item.id}/information?apiKey=${apiInfo.api_key}&includeNutrition=false
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
    console.log(results.bahan_recipes);
    let textTTS = "";

    results.forEach(element => {
        textTTS+= "Nama resep : "+element.nama_recipes.toString()+" Bahan - bahan : "+element.bahan_recipes.toString()+" Cara Memasak : "+element.instruksi_recipes.toString();
    });

    textTTS = await translate.translate(textTTS, 'id');
    
    results.forEach(async element => {
        element.bahan_recipes = await translate.translate(element.bahan_recipes, 'id');
        element.instruksi_recipes = await translate.translate(element.instruksi_recipes, 'id');
        element.nama_recipes = await translate.translate(element.nama_recipes, 'id');
        element.deskripsi_recipes = await translate.translate(element.deskripsi_recipes,'id');
        // console.log(element.instruksi_recipes[0].toString());
        // textTTS+= "Nama resep : "+element.nama_recipes[0].toString()+" Bahan - bahan : "+element.bahan_recipes[0].toString()+" Cara Memasak : "+element.instruksi_recipes[0].toString();
    });

    

    console.log("TEXT TTS TRANSLATED: "+textTTS);
    let ttsFileName = Math.floor(new Date().getTime() / 1000)+".mp3";

    await Text2Speech({
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
    });

    return res.status(200).json({
        status: 200,
        message: 'Pencarian berhasil.',
        recipes: results,
        text_to_speech: 'https://8080-cs-237213409382-default.asia-southeast1.cloudshell.dev/api/download?file='+ttsFileName
    });
});

//DOWNLOAD TTS FILE
router.get('/download', async (req, res) => {
    let fileName = req.query.file;
    res.sendFile(fileName, { root: path.join(__dirname, '../public/') });
});


module.exports= router;