const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/follow';
const method= 'POST';

let tokenhubert;
let tokenjonsu;
let tokengidion;
let follow_id=0;

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

    it('Passed (havent follow yet)', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', tokenjonsu)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message').eql('belum mengikuti siapapun');
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

describe('/post', () => {
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

    it('Not Passed (without field)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('harus menyertakan parameter user_id');
                done();
            })
    }).timeout(10000);

    it('Not Passed (self following)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                user_id:2
            })
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('tidak dapat follow diri sendiri');
                done();
            })
    }).timeout(10000);

    it('Not Passed (user_id not found)', (done)=>{
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                user_id: 9999999
            })
            .end((err,res)=>{
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('id user tidak ditemukan');
                done();
            })
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .post(endpoint)
            .set('x-access-token', tokengidion)
            .send({
                user_id:4
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message');
                done();
            });
    }).timeout(10000);
});

describe('/delete', ()=>{
    tokenTest.withoutToken(endpoint+'/4', 'DELETE');
    tokenTest.withOutValidToken(endpoint+'/4', 'DELETE');

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
    
    it('Not Passed (user_id not found)', (done)=>{
        chai.request(host)
            .del(endpoint+"/99999")
            .set('x-access-token', tokengidion)
            .end((err,res)=>{
                res.should.have.status(404);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(404);
                res.body.should.have.property('message').eql('id user tidak ditemukan');
                done();
            })
    }).timeout(10000);

    it('Not Passed (self unfollowing)', (done)=>{
        chai.request(host)
            .del(endpoint+"/2")
            .set('x-access-token', tokengidion)
            .end((err,res)=>{
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('tidak dapat unfollow diri sendiri');
                done();
            })
    }).timeout(10000);

    it('Pass (not followed)', (done)=>{
        chai.request(host)
            .del(endpoint+"/3")
            .set('x-access-token', tokengidion)
            .end((err,res)=>{
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message');
                done();
            })
    }).timeout(10000);

    it('Pass', (done)=>{
        chai.request(host)
            .del(endpoint+"/4")
            .set('x-access-token', tokengidion)
            .end((err,res)=>{
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message');
                done();
            })
    }).timeout(10000);
})


