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
});

module.exports= router;
