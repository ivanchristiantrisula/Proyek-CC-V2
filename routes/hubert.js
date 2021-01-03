const thirdPartyAPI= require('../thirdPartyAPI');
const getAPIKey= require('../modules/getAPIKey');
const verifyToken= require('../modules/verifyToken');
const upload= require('../modules/upload');
const asyncForEach= require('../modules/asyncForEach');
const db= require('../database');

const express= require('express');
const jwt= require('jsonwebtoken');
const fetch= require('node-fetch');

const router= express.Router();

router.get('/users/favorite',async (req,res)=>{
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    let query= await db.executeQuery(`
        SELECT favorite.fav_id as fav_id, recipes.nama_recipes, recipes.deskripsi_recipes
        FROM favorite, recipes
        WHERE favorite.user_id = '${verified.id_users}' AND favorite.recipe_id = recipes.id_recipes
        GROUP BY favorite.fav_id,favorite.recipe_id, recipes.nama_recipes, recipes.deskripsi_recipes
    `);
    if(!query.rows.length){
        return res.json({
            status:200,
            message: "tidak ada resep yang difavorite"
        })
    }
    return res.json({
        status:200,
        message: "sukses",
        data: query.rows
    });
})
router.post('/users/favorite',async (req,res)=>{
    const datas = req.body
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(!datas.recipe_id){
        return res.status(400).send({
            status:400,
            message: "recipe_id harus disertakan"
        })
    }
    let query = await db.executeQuery(`
        SELECT *
        FROM recipes
        WHERE id_recipes = '${datas.recipe_id}'
    `);
    if(!query.rows.length){
        return res.status(400).json({
            status:400,
            message: "recipe_id tidak valid"
        })
    }
    let insertquery = await db.executeQuery(`
        INSERT INTO favorite (user_id,recipe_id) VALUES ('${verified.id_users}','${datas.recipe_id}')
    `)
    let select_id = await db.executeQuery(`
        SELECT MAX(fav_id) as fav_id from favorite
    `)
    return res.json({
        status:200,
        fav_id: select_id.rows[0].fav_id,
        message: "sukses menambahkan ke favorite"
    })

})
router.delete('/users/favorite/:fav_id',async (req,res)=>{
    const datas = req.params
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(!datas.fav_id){
        return res.status(400).json({
            status:400,
            message: "fav_id harus disertakan"
        })
    }
    let query = await db.executeQuery(`SELECT * FROM favorite WHERE fav_id = '${datas.fav_id}' and user_id = ${verified.id_users}`)
    if(!query.rows.length) return res.status(404).json({status:404, message:"fav_id tidak ditemukan"})
    let deletequery = await db.executeQuery(`DELETE FROM favorite WHERE fav_id = '${datas.fav_id}'`)
    return res.json({
        status:200,
        message: "suskses delete dari favorite!"
    })
})

router.get('/users/follow', async (req,res)=>{
    const datas = req.body
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(verified.tipe_users == 0) return res.status(401).json({status:401, message:"hanya user premium"})
    let query = await db.executeQuery(`
        SELECT follow_following as id_users, u.nama_users as nama_users
        FROM follow f, users u
        WHERE f.follow_user = ${verified.id_users}
            and f.follow_following = u.id_users
    `)
    if(!query.rows.length)
        return res.json({
            status:200,
            message: "belum mengikuti siapapun"
        })
    else
        return res.json({
            status:200,
            message: "sukses",
            data:query.rows
        })
})
router.post('/users/follow', async (req,res)=>{
    const datas = req.body
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(verified.tipe_users == 0) return res.status(401).json({status:401, message:"hanya user premium"})
    if(!datas.user_id) return res.status(400).json({
        status:400,
        message: "harus menyertakan parameter user_id"
    })
    if(datas.user_id == verified.id_users) return res.status(400).json({status:400, message:"tidak dapat follow diri sendiri"})
    let query = await db.executeQuery(`SELECT * FROM users WHERE id_users = ${datas.user_id}`)
    if(!query.rows.length) return res.status(404).send({status:404, message:"id user tidak ditemukan"})
    const nama = query.rows[0].nama_users
    query = await db.executeQuery(`SELECT * FROM follow WHERE follow_following = ${datas.user_id} AND follow_user = ${verified.id_users}`)
    if(!query.rows.length){
        let insertquery = await db.executeQuery(`insert into follow values (${verified.id_users}, ${datas.user_id})`)
    }
    return res.json({
        status:200,
        message: "sukses follow " + nama
    })

})
router.delete('/users/follow/:user_id', async (req,res)=>{
    const datas = req.params
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(verified.tipe_users == 0) return res.status(401).json({status:401, message:"hanya user premium"})
    if(!datas.user_id) return res.status(400).json({
        status:400,
        message: "harus menyertakan parameter user_id"
    })
    if(datas.user_id == verified.id_users) return res.status(400).json({status:400, message:"tidak dapat unfollow diri sendiri"})
    let query = await db.executeQuery(`SELECT * FROM users WHERE id_users = ${datas.user_id}`)
    if(!query.rows.length) return res.status(404).send({status:404, message:"id user tidak ditemukan"})
    const nama = query.rows[0].nama_users
    query = await db.executeQuery(`SELECT * FROM follow WHERE follow_following = ${datas.user_id} AND follow_user = ${verified.id_users}`)
    if(query.rows.length){
        let insertquery = await db.executeQuery(`DELETE FROM follow where  follow_user = ${verified.id_users} and follow_following =  ${datas.user_id}`)
        return res.json({
            status:200,
            message: "sukses unfollow " + nama
        })
    }else{
        return res.json({
            status:200,
            message: nama + " belum difollow"
        })
    }
})
router.get('/users/shareRecipe', async (req,res)=>{
    const datas = req.query
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(verified.tipe_users == 0) return res.status(401).json({status:401, message:"hanya user premium"})
    const id_source = (datas.id_source)? datas.id_source : ""
    let q = `
        SELECT u.id_users as id_users, u.nama_users as nama_users,r.id_recipes as id_recipes, r.nama_recipes as nama_recipes, r.deskripsi_recipes as deskripsi_recipes 
        FROM share s, recipes r, users u
        WHERE s.share_user_id_dest = ${verified.id_users}
            AND u.id_users = s.share_user_id_source
            AND r.id_recipes = s.share_recipe_id`
    if(id_source != "") q+= ` AND s.share_user_id_source = ${id_source}`
    q += ` ORDER BY u.id_users`
    let query = await db.executeQuery(q)
    if(!query.rows.length)
        return res.status(404).json({
            status:404,
            message: "belum pernah menerima share"
        })
    return res.json({
        status:200,
        message:"sukses",
        data:query.rows
    })
})
router.post('/users/shareRecipe', async (req,res)=>{
    const datas = req.body
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    if(verified.tipe_users == 0) return res.status(401).json({status:401, message:"hanya user premium"})
    if(!datas.share_recipe || !datas.share_to) return res.status(400).json({status:400, message:"semua data harus terisi"})
    if(datas.share_to == verified.id_users) return res.status(400).json({status:400, message:"tidak dapat share resep ke diri sendiri"})
    let query = await db.executeQuery(`select * from users where id_users = ${datas.share_to}`)
    if(!query.rows.length) return res.status(404).json({status:404, message:"user tidak ditemukan"})
    let nama = query.rows[0].nama_users
    query = await db.executeQuery(`select * from recipes where id_recipes = ${datas.share_recipe}`)
    if(!query.rows.length) return res.status(404).json({status:404, message:"resep tidak ditemukan"})
    query = await db.executeQuery(`select * from follow where follow_user = ${verified.id_users} and follow_following = ${datas.share_to}`)
    if(!query.rows.length) return res.status(404).json({status:404, message:"belum follow " + nama})
    query = await db.executeQuery(`select * from share where share_user_id_source = ${ verified.id_users} and share_user_id_dest = ${datas.share_to} and share_recipe_id = ${datas.share_recipe}`)
    if(!query.rows.length){
        let insertquery = await db.executeQuery(`insert into share (share_user_id_source, share_user_id_dest, share_recipe_id) values (${verified.id_users}, ${datas.share_to}, '${datas.share_recipe}')`)
    }
    return res.json({
        status:200,
        message: "sukses share resep ke " + nama
    })
})

router.get('/recipes/searchByIngredients', async (req,res)=>{
    const token= req.header('x-access-token');
    const verified= verifyToken(token);
    if (!verified.id_users) {
        return res.status(verified.status).json(verified);
    }
    //if(verified.tipe_users == 0) return res.status(401).json({status:401, message:"hanya user premium"})
    if (!req.query.key || !req.query.ingredient) {
        return res.status(401).json({
            status: 401,
            message: 'Parameter key dan ingredient tidak boleh kosong.'
        });
    }
    const limit = (!req.query.limit) ? "": req.query.limit
    let query= await db.executeQuery(`
        SELECT *
        FROM users
        WHERE api_key = '${req.query.key}' and id_users = ${verified.id_users}
    `);

    if (!query.rows.length) {
        return res.status(401).json({
            status: 401,
            message: 'Anda tidak memiliki akses.'
        });
    } 
    
    if (query.rows[0].api_hit === 0) {
        return res.status(401).json({
            status: 401,
            message: 'API hit habis.'
        });
    }

    let results= [];
    let fetchAPI= await fetch(`
        ${thirdPartyAPI.host}/findByIngredients?apiKey=${thirdPartyAPI.api_key_hubert}&ingredients=${req.query.ingredient}&number=${limit}`
    );
    let recipes= await fetchAPI.json();
    
    await recipes.asyncForEach(async item => {
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

            informations.extendedIngredients= informations.extendedIngredients.map(i => i.original);
            informations.analyzedInstructions[0].steps= informations.analyzedInstructions[0].steps.map(i => i.step);

            results.push({
                id_recipes: informations.id,
                nama_recipes: informations.title.replace(/["']/g, ""),
                deskripsi_recipes: informations.summary.replace(/["']/g, ""),
                bahan_recipes: informations.extendedIngredients,
                instruksi_recipes: informations.analyzedInstructions[0].steps
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
                    '${informations.analyzedInstructions[0].steps.join(', ').replace(/["']/g, "")}'
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

    return res.status(200).json({
        status: 200,
        message: 'Pencarian berhasil.',
        recipes: results
    });
    
})
module.exports = router