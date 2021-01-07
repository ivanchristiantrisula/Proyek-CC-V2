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
    let limit = req.query.limit;

    let apiInfo = await thirdPartyAPI.APIInfo();
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    else
    {
        let queryapi = `select * from users where id_users = ${verified.id_users}`;
        let hasilapi = await db.executeQuery(queryapi);
        if(hasilapi.rows.length>0)
        {
            var id = req.query.id;
            let results= [];
            if(id==undefined)
            {
                return res.status(400).send("Id harus diisi");
            }
            
            else if(limit!=undefined)
            {
                let fetchAPI= await fetch(`
                    ${apiInfo.host}/${id}/similar?apiKey=${apiInfo.api_key}&number=${limit}`
                );
                let recipes= await fetchAPI.json();
                console.log(recipes);
                for (let index = 0; index < recipes.length; index++) {
                    results.push({
                        id_recipes : recipes[index].id,
                        nama_recipes : recipes[index].title
                    })            
                }
            }
            else{
                let fetchAPI= await fetch(`
                    ${apiInfo.host}/${id}/similar?apiKey=${apiInfo.api_key}`
                );
                let recipes= await fetchAPI.json()
                console.log(recipes);
                for (let index = 0; index < recipes.length; index++) {
                    results.push({
                        id_recipes : recipes[index].id,
                        nama_recipes : recipes[index].title
                    })            
                }
            }

            return res.status(200).send(results);
        }
        else
        {
            res.status(404).send("Api key tidak valid");
        }
    }  
});

module.exports= router;
