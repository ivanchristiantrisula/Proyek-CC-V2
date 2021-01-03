const thirdPartyAPI= require('../thirdPartyAPI');
const getAPIKey= require('../modules/getAPIKey');
const verifyToken= require('../modules/verifyToken');
const upload= require('../modules/upload');
const asyncForEach= require('../modules/asyncForEach');
const db= require('../database');

const express= require('express');
const jwt= require('jsonwebtoken');
const fetch= require('node-fetch');

const app = express();
const router= express.Router();

const config= {
    host: 'https://api.spoonacular.com/mealplanner/generate',
    api_key: '816d476582ca48809294ef256fce7450'
};

router.get("/meals/generate",async function(req,res){
    let recipes;
    const token= req.header('x-access-token');
    const verified= verifyToken(token,true);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    var api_key = req.query.api_key;
    if(api_key==undefined)
    {
        return res.status(400).send("Api Key tidak ada");
    }
    else{
        let querycekhit = `select * from users where api_hit>0 and id_users = ${verified.id_users}`;
        let hasilcekhit = await db.executeQuery(querycekhit);
        //console.log(hasilcekhit);
        if(hasilcekhit.rows.length>0)
        {
            let queryapi = `select * from users where id_users = ${verified.id_users} and api_key='${api_key}'`;
            let hasilapi = await db.executeQuery(queryapi);
            if(hasilapi.rows.length>0)
            {
                var targetCalories = req.query.targetCalories;
                var timeFrame = req.query.timeFrame;
                let results= [];
                
                if(targetCalories==undefined&&timeFrame==undefined)
                {
                    let fetchAPI= await fetch(`
                        ${config.host}?apiKey=${config.api_key}`
                    );
                    recipes= await fetchAPI.json();
                }
                else if(targetCalories!=undefined&&timeFrame==undefined)
                {
                    let fetchAPI= await fetch(`
                        ${config.host}?apiKey=${config.api_key}&targetCalories=${targetCalories}`
                    );
                    recipes= await fetchAPI.json();
                }
                else if(targetCalories!=undefined&&timeFrame==undefined)
                {
                    let fetchAPI= await fetch(`
                        ${config.host}?apiKey=${config.api_key}&timeFrame=${timeFrame}`
                    );
                    recipes= await fetchAPI.json();
                }
                else{
                    let fetchAPI= await fetch(`
                        ${config.host}?apiKey=${config.api_key}&targetCalories=${targetCalories}&timeFrame=${timeFrame}`
                    );
                    recipes= await fetchAPI.json();
                }
                
            }
            else
            {
                return res.status(400).send("Api Key tidak valid"); 
            }
            let query = `update users set api_hit = api_hit-1 where id_users =${verified.id_users}`;
            let hasil = await db.executeQuery(query);
            if(hasil.rowCount!=0)
            {
                res.status(200).send(recipes);
            }
            // else
            // {
            //     res.status(400).send("Api hit habis");
            // }
        }
        else{
            return res.status(400).send("Api hit habis");
        }
    }
})

router.get("/recipes/similiar",async function(req,res){
    const token= req.header('x-access-token');
    const verified= verifyToken(token,true);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    var api_key = req.query.api_key;
    if(api_key==undefined)
    {
        return res.status(400).send("Api Key tidak ada");
    }
    else
    {
        let queryapi = `select * from users where id_users = ${verified.id_users} and api_key='${api_key}'`;
        let hasilapi = await db.executeQuery(queryapi);
        if(hasilapi.rows.length>0)
        {
            var id = req.query.id;
            var limit = req.query.limit;
            let results= [];
            if(id==undefined)
            {
                return res.status(400).send("Id harus diisi");
            }
            
            else if(limit!=undefined)
            {
                let fetchAPI= await fetch(`
                    ${thirdPartyAPI.host}/${id}/similar?apiKey=${config.api_key}&number=${limit}`
                );
                let recipes= await fetchAPI.json();
                //onsole.log(recipes);
                for (let index = 0; index < recipes.length; index++) {
                    results.push({
                        id_recipes : recipes[index].id,
                        nama_recipes : recipes[index].title
                    })            
                }
                if(results.length)
                {
                    let query3 = `update users set api_hit = api_hit-1 where id_users =${verified.id_users} and api_hit>0`;
                    let hasil3 = await db.executeQuery(query3);
                    if(hasil3.rowCount!=0){
                        return res.status(200).send(results);
                    }
                    else{
                        return res.status(400).send("Api hit habis");
                    }
                }
            }
            else{
                let fetchAPI= await fetch(`
                    ${thirdPartyAPI.host}/${id}/similar?apiKey=${config.api_key}`
                );
                let recipes= await fetchAPI.json();
                for (let index = 0; index < recipes.length; index++) {
                    results.push({
                        id_recipes : recipes[index].id,
                        nama_recipes : recipes[index].title
                    })            
                }
                if(results.length)
                {
                    let query3 = `update users set api_hit = api_hit-1 where id_users =${verified.id_users} and api_hit>0`;
                    let hasil3 = await db.executeQuery(query3);
                    if(hasil3.rowCount!=0){
                        return res.status(200).send(results);
                    }
                    else{
                        return res.status(400).send("Api hit habis");
                    }
                }
            }
        }
        else
        {
            res.status(404).send("Api key tidak valid");
        }
    }
    
})

router.get("/recipes/myRecipe",async function(req,res){
    const token= req.header('x-access-token');
    const verified= verifyToken(token,true);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    let query = `select * from recipes where id_users = ${verified.id_users}`;
    let hasil = await db.executeQuery(query);
    if(hasil)
    {
        return res.status(200).send(hasil.rows);
    }
    else if(hasil.rows.length==0)
    {
        return res.status(200).send("Tidak ada resep");
    }
    else
    {
        return res.status(404).send("Resep tidak ditemukan");
    }
})

router.delete("/recipes/myRecipe",async function(req,res){
    const token= req.header('x-access-token');
    const verified= verifyToken(token,true);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    var id_users = verified.id_users;
    var id_recipes = req.body.id_recipes;
    let query = `select * from recipes where id_users = ${id_users} and id_recipes= ${id_recipes}`;
    let hasil = await db.executeQuery(query);
    if(hasil.rows.length>0)
    {
        let query2 = `delete from recipes where id_recipes=${id_recipes}`;
        let hasil2 = await db.executeQuery(query2);
        if(hasil2)
        {
            res.status(200).send("Delete Success");
        }
        else{
            res.status(400).send("Error Delete");
        }
    }
    else
    {
        res.status(404).send("Id User atau Id Recipe salah");
    }
})
router.put("/recipes/myRecipe",async function(req,res){
    const token= req.header('x-access-token');
    const verified= verifyToken(token,true);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    var id_users = verified.id_users;
    console.log(verified);
    var nama_recipes = req.body.nama_recipes;
    var deskripsi_recipes = req.body.deskripsi_recipes;
    var bahan_recipes = req.body.bahan_recipes;
    var instruksi_recipes = req.body.instruksi_recipes;
    var id_recipes = req.body.id_recipes;
    if(id_users==undefined||id_recipes==undefined)
    {
        return res.status(404).send(
            "Id User dan Id Recipes harus diisi"
        );
    }
    else
    {
        console.log(id_users);
        console.log(id_recipes);
        
        let query = `select * from recipes where id_users =${id_users} and id_recipes=${id_recipes}`;
        let hasil = await db.executeQuery(query);
        console.log(hasil);
        let query2,hasil2;
        if(hasil.rows.length>0)
        {
            if(nama_recipes!=undefined)
            {
                if(deskripsi_recipes!=undefined)
                {
                    if(bahan_recipes!=undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      deskripsi_recipes='${deskripsi_recipes}',
                                      bahan_recipes='${bahan_recipes}',
                                      instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      deskripsi_recipes='${deskripsi_recipes}',
                                      bahan_recipes='${bahan_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                    else if(bahan_recipes==undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      deskripsi_recipes='${deskripsi_recipes}',
                                      instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      deskripsi_recipes='${deskripsi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                }
                else if(deskripsi_recipes==undefined)
                {
                    if(bahan_recipes!=undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      bahan_recipes='${bahan_recipes}',
                                      instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      bahan_recipes='${bahan_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                    else if(bahan_recipes==undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set nama_recipes='${nama_recipes}',
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                }
            }
            else if(nama_recipes==undefined)
            {
                if(deskripsi_recipes!=undefined)
                {
                    if(bahan_recipes!=undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set deskripsi_recipes='${deskripsi_recipes}',
                                      bahan_recipes='${bahan_recipes}',
                                      instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set deskripsi_recipes='${deskripsi_recipes}',
                                      bahan_recipes='${bahan_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                    else if(bahan_recipes==undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set deskripsi_recipes='${deskripsi_recipes}',
                                      instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set deskripsi_recipes='${deskripsi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                }
                else if(deskripsi_recipes==undefined)
                {
                    if(bahan_recipes!=undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set bahan_recipes='${bahan_recipes}',
                            instruksi_recipes='${instruksi_recipes}'
                            where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            query2 = `update recipes set bahan_recipes='${bahan_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                    }
                    else if(bahan_recipes==undefined)
                    {
                        if(instruksi_recipes!=undefined)
                        {
                            query2 = `update recipes set instruksi_recipes='${instruksi_recipes}'
                                      where id_recipes =${id_recipes}`;
                        }
                        else
                        {
                            return res.status(404).send("Salah satu field harus diisi");
                        }
                    }
                }
            }
            hasil2 = await db.executeQuery(query2);
            if(hasil2.rowCount != 0)
            {
                return res.status(200).send("Update Sukses");
            }
            else
            {
                return res.status(400).send("Error Update");
            }
        }
        else
        {
            return res.status(404).send("Id recipe salah atau Id user salah");
        }
    }
})

router.post("/recipes/myRecipe",async function(req,res){
    const token= req.header('x-access-token');
    const verified= verifyToken(token,true);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    
    var id_users = verified.id_users;
    var nama_recipes = req.body.nama_recipes;
    var deskripsi_recipes = req.body.deskripsi_recipes;
    var bahan_recipes = req.body.bahan_recipes;
    var instruksi_recipes = req.body.instruksi_recipes;
    var id_recipes = id_users + Math.round(Math.random()*100000000);
    if(id_users==undefined||nama_recipes==undefined||deskripsi_recipes==undefined||bahan_recipes==undefined||instruksi_recipes==undefined)
    {
        return res.status(404).send(
            "Semua field harus diisi"
        );
    }
    let query = `select * from users where id_users = '${id_users}'`;
    let hasil = await db.executeQuery(query);
    if(hasil.rows.length==0)
    {
        res.status(404).send(
            "Id User tidak ditemukan"        
        );
    }
    else
    {
        let query2 = `INSERT INTO recipes (
            id_recipes,
            nama_recipes,
            deskripsi_recipes,
            bahan_recipes,
            instruksi_recipes,
            id_users
        ) VALUES (
            ${id_recipes},
            '${nama_recipes}',
            '${deskripsi_recipes}',
            '${bahan_recipes}',
            '${instruksi_recipes}',
            ${id_users}
        )`;
        let hasil2 = await db.executeQuery(query2);
        if(hasil2)
        {
            res.status(200).send({
                "msg" : "Success Add Resep",
                "id_recipes" : id_recipes
            });
        }
        else
        {
            res.status(400).send("Error Insert Resep");
        }
    }
})





module.exports= router;
