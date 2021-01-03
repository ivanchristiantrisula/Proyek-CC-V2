const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/recipes/myRecipe';
const method= 'POST';

let token;
let token2;
let fav_id=0;

before((done) => {
    chai.request(host)
        .post('/api/users/login')
        .send({
            email_users: 'jonsu@mail.com',
            password_users: 'asd' 
        })
        .end((err, res) => {
            token= res.body.token;
        done();
    });
});

before((done) => {
    chai.request(host)
        .get('/api/users/profile')
        .set('x-access-token', token)
        .end((err, res) => {
            user= res.body.profile;
        done();
        });
});

describe('/get',()=>{
    tokenTest.withoutToken(endpoint, "GET");
    tokenTest.withOutValidToken(endpoint, "GET");

    it('Passed', (done) => {
        chai.request(host)
            .get(`${endpoint}`)
            .set('x-access-token', token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.an('array');
                // res.body.should.have.property('status').eql(200);
                // res.body.should.have.property('message').eql('Pencarian berhasil.');
                // res.body.should.have.property('recipes').to.be.an('array');
                chai.request(host)
                    .put('/api/users/jonsu@mail.com')
                    .send({
                        api_hit: 1
                    })
                    .end(done);
            });
    }).timeout(50000);
})

describe('/post',()=>{
    tokenTest.withoutToken(endpoint, "POST");
    tokenTest.withOutValidToken(endpoint, "POST");

    it('Not passed (without fields)', (done) => {
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', token)
            .send({
                id_users: undefined,
                nama_recipes: undefined,
                deskripsi_recipes:undefined,
                bahan_recipes:undefined,
                instruksi_recipes:undefined
            })
            .end((err, res) => {
                res.should.have.status(404);
                res.text.should.be.eql('Semua field harus diisi');
                // res.body.should.have.property('status').eql(400);
                // res.body.should.have.property('message').eql('Field tidak boleh kosong!');
            done();
            });
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .post(`${endpoint}`)
            .set('x-access-token', token)
            .send({
                id_users: 4,
                nama_recipes: "makananku",
                deskripsi_recipes:"ini makananku",
                bahan_recipes:"telur",
                instruksi_recipes:"dimasak"
            })
            .end((err, res) => {
                fav_id=res.body.id_recipes;
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('msg').eql('Success Add Resep');
                
                // res.body.should.have.property('status').eql(200);
                // res.body.should.have.property('message').eql('Pencarian berhasil.');
                // res.body.should.have.property('recipes').to.be.an('array');
                // chai.request(host)
                //     .put('/api/users/jonsu@mail.com')
                //     .send({
                //         api_hit: 1
                //     })
                //     .end(done);
            done();
            });
    }).timeout(50000);
})

describe('/put',()=>{
    tokenTest.withoutToken(endpoint, "PUT");
    tokenTest.withOutValidToken(endpoint, "PUT");
    
    it('Not passed (without fields)', (done) => {
        chai.request(host)
            .put(endpoint)
            .set('x-access-token', token)
            .send({
                id_users:undefined,
                id_recipes:undefined
            })
            .end((err, res) => {
                res.should.have.status(404);
                res.text.should.be.eql('Id User dan Id Recipes harus diisi');
                // res.body.should.have.property('status').eql(400);
                // res.body.should.have.property('message').eql('Field tidak boleh kosong!');
            done();
            });
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .put(endpoint)
            .set('x-access-token', token)
            .send({
                id_recipes:fav_id,
                nama_recipes:"test",
                deskripsi_recipes:"test",
                bahan_recipes:"test",
                instruksi_recipes:"test"
            })
            .end((err, res) => {
                // console.log(res.text);
                res.should.have.status(200);
                res.text.should.be.eql('Update Sukses');
                // res.body.should.have.property('status').eql(400);
                // res.body.should.have.property('message').eql('Field tidak boleh kosong!');
            done();
            });
    }).timeout(10000);
})

describe('/delete', ()=>{
    tokenTest.withoutToken(endpoint, "DELETE");
    tokenTest.withOutValidToken(endpoint, "DELETE");

    // it('Not Pass (not premium)', (done) => {
    //     chai.request(host)
    //         .get(endpoint)
    //         .set('x-access-token', tokenhubert)
    //         .end((err, res) => {
    //             res.should.have.status(401);
    //             res.body.should.be.a('object');
    //             res.body.should.have.property('status').eql(401);
    //             res.body.should.have.property('message').eql('hanya user premium');
    //         done();
    //         });
    // }).timeout(10000);

    /*
    it('Not Passed (without field)', (done)=>{
        chai.request(host)
            .del(endpoint+"/")
            .set('x-access-token', token2)
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('fav_id harus disertakan');
                done();
            })
    }).timeout(10000);
    */
    
    it('Not Passed (user_id / id_recipes not found)', (done)=>{
        chai.request(host)
            .del(endpoint)
            .set('x-access-token', token)
            .send({
                id_users:300,
                id_recipes:1957889342,
            })
            .end((err,res)=>{
                res.should.have.status(404);
                res.text.should.be.eql('Id User atau Id Recipe salah');
                // res.body.should.have.property('status').eql(404);
                // res.body.should.have.property('message').eql('id user tidak ditemukan');
                done();
            })
    }).timeout(10000);

    it('Passed', (done)=>{
        chai.request(host)
            .del(endpoint)
            .set('x-access-token', token)
            .send({
                id_users:4,
                id_recipes:fav_id,
            })
            .end((err,res)=>{
                res.should.have.status(200);
                res.text.should.be.eql('Delete Success');
                // res.body.should.have.property('status').eql(404);
                // res.body.should.have.property('message').eql('id user tidak ditemukan');
                done();
            })
    }).timeout(10000);  
})




