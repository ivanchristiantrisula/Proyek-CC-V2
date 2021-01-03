const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/favorite';
const method= 'POST';

let token;
let token2;
let fav_id=0;

before((done) => {
    chai.request(host)
        .post('/api/users/login')
        .send({
            email_users: 'gidion@mail.com',
            password_users: 'asd' 
        })
        .end((err, res) => {
            token= res.body.token;
        done();
    });
});
before((done) => {
    chai.request(host)
        .post('/api/users/login')
        .send({
            email_users: 'hubert@mail.com',
            password_users: 'asd' 
        })
        .end((err, res) => {
            token2= res.body.token;
        done();
    });
});

describe('/get', () => {
    tokenTest.withoutToken(endpoint, 'GET');
    tokenTest.withOutValidToken(endpoint, 'GET');

    it('Passed (no favorite found)', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message').eql('tidak ada resep yang difavorite');
            done();
            });
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', token2)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message').eql('sukses');
                res.body.should.have.property('data');
                done();
            });
    }).timeout(10000);
});

describe('/post', () => {
    tokenTest.withoutToken(endpoint, 'POST');
    tokenTest.withOutValidToken(endpoint, 'POST');

    it('Not Passed (without field)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', token2)
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('recipe_id harus disertakan');
                done();
            })
    }).timeout(10000);

    it('Not Passed (invalid recipe_id)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', token2)
            .send({
                recipe_id: 9999999
            })
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('recipe_id tidak valid');
                done();
            })
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', token2)
            .send({
                recipe_id:630293
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('fav_id');
                res.body.should.have.property('message').eql('sukses menambahkan ke favorite');
                fav_id = res.body.fav_id;
                done();
            });
    }).timeout(10000);
});

describe('/delete', ()=>{
    tokenTest.withoutToken(endpoint+'/0', 'DELETE');
    tokenTest.withOutValidToken(endpoint+'/0', 'DELETE');
    
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
    it('Not Passed (fav_id not found)', (done)=>{
        chai.request(host)
            .del(endpoint+"/0")
            .set('x-access-token', token2)
            .end((err,res)=>{
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('fav_id tidak ditemukan');
                done();
            })
    }).timeout(10000);

    it('Pass', (done)=>{
        chai.request(host)
            .del(endpoint+"/"+fav_id)
            .set('x-access-token', token2)
            .end((err,res)=>{
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message').eql('suskses delete dari favorite!');
                done();
            })
    }).timeout(10000);
})


