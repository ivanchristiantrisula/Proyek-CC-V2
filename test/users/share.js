const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/shareRecipe';
const method= 'POST';

let tokenhubert;
let tokenjonsu;
let tokengidion;

before((done) => {
    chai.request(host)
        .post('/api/users/login')
        .send({
            email_users: 'gidion@mail.com',
            password_users: 'asd' 
        })
        .end((err, res) => {
            tokengidion= res.body.token;
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
            tokenhubert= res.body.token;
        done();
    });
});
before((done) => {
    chai.request(host)
        .post('/api/users/login')
        .send({
            email_users: 'jonsu@mail.com',
            password_users: 'asd' 
        })
        .end((err, res) => {
            tokenjonsu= res.body.token;
        done();
    });
});

describe('/get', () => {
    tokenTest.withoutToken(endpoint, 'GET');
    tokenTest.withOutValidToken(endpoint, 'GET');

    it('Not Pass (not premium)', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', tokenhubert)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(401);
                res.body.should.have.property('message').eql('hanya user premium');
            done();
            });
    }).timeout(10000);

    it('Passed (havent recived recipe yet)', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', tokenjonsu)
            .end((err, res) => {
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('belum pernah menerima share');
            done();
            });
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', tokengidion)
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

describe('/post', ()=>{
    tokenTest.withoutToken(endpoint, 'POST');
    tokenTest.withOutValidToken(endpoint, 'POST');

    it('Not Pass (not premium)', (done) => {
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokenhubert)
            .end((err, res) => {
                res.should.have.status(401);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(401);
                res.body.should.have.property('message').eql('hanya user premium');
            done();
            });
    }).timeout(10000);

    it('Not Pass (without field)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('semua data harus terisi');
                done();
            });
    }).timeout(10000);

    it('Not Pass (without field share_to)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_recipe:123
            })
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('semua data harus terisi');
                done();
            });
    }).timeout(10000);

    it('Not Pass (without field share_recipe)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_to:123
            })
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('semua data harus terisi');
                done();
            });
    }).timeout(10000);

    it('Not Pass (self sharing)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_recipe:215435,
                share_to:2
            })
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('tidak dapat share resep ke diri sendiri');
                done();
            });
    }).timeout(10000);

    it('Not Pass (user not found)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_recipe:215435,
                share_to:999999
            })
            .end((err,res)=>{
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('user tidak ditemukan');
                done();
            });
    }).timeout(10000);

    it('Not Pass (recipe not found)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_recipe:1,
                share_to:1
            })
            .end((err,res)=>{
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('resep tidak ditemukan');
                done();
            });
    }).timeout(10000);

    it('Not Pass (havent follow)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_recipe:215435,
                share_to:3
            })
            .end((err,res)=>{
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message');
                done();
            });
    }).timeout(10000);

    it('Pass', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                share_recipe:215435,
                share_to:1
            })
            .end((err,res)=>{
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message');
                done();
            });
    }).timeout(10000);
})