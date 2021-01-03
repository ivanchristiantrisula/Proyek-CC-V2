const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/recipes/search';
const method= 'GET';

let token, user;

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

tokenTest.withoutToken(endpoint, method);
tokenTest.withOutValidToken(endpoint, method);

it('Not passed (without parameter query)', (done) => {
    chai.request(host)
        .get(endpoint)
        .set('x-access-token', token)
        .end((err, res) => {
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(401);
            res.body.should.have.property('message').eql('Parameter key dan query tidak boleh kosong.');
        done();
        });
}).timeout(10000);

it('Not passed (without valid key)', (done) => {
    chai.request(host)
        .get(`${endpoint}?key=test&query=pizza&limit=3`)
        .set('x-access-token', token)
        .end((err, res) => {
            res.should.have.status(401);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(401);
            res.body.should.have.property('message').eql('Anda tidak memiliki akses.');
        done();
        });
}).timeout(10000);

it('Not passed (without enough API Hit)', (done) => {
    chai.request(host)
        .put('/api/users/jonsu@mail.com')
        .send({
            api_hit: -1
        })
        .end(() => {
            chai.request(host)
                .get(`${endpoint}?key=56LpQTEr75&query=pizza&limit=3`)
                .set('x-access-token', token)
                .end((err, res) => {
                    res.should.have.status(401);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eql(401);
                    res.body.should.have.property('message').eql('API hit habis.');

                    chai.request(host)
                        .put('/api/users/jonsu@mail.com')
                        .send({
                            api_hit: user.api_hit
                        })
                        .end(done);
                }); 
        });
}).timeout(10000);

it('Passed', (done) => {
    chai.request(host)
        .get(`${endpoint}?key=56LpQTEr75&query=pizza&limit=3`)
        .set('x-access-token', token)
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(200);
            res.body.should.have.property('message').eql('Pencarian berhasil.');
            res.body.should.have.property('recipes').to.be.an('array');

            chai.request(host)
                .put('/api/users/jonsu@mail.com')
                .send({
                    api_hit: 1
                })
                .end(done);
        });
}).timeout(50000);









