const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/getPremium';
const method= 'PUT';

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

it('Not passed (without fields)', (done) => {
    chai.request(host)
        .put(endpoint)
        .set('x-access-token', token)
        .send({
            email_users: undefined,
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(400);
            res.body.should.have.property('message').eql('Field tidak boleh kosong!');
        done();
        });
}).timeout(10000);

it('Not passed (without valid e-mail)', (done) => {
    chai.request(host)
        .put(endpoint)
        .set('x-access-token', token)
        .send({
            email_users: 'test@mail.com'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(400);
            res.body.should.have.property('message').eql('E-mail tidak cocok!');
        done();
        });
}).timeout(10000);

it('Not passed (because already premium account)', (done) => {
    chai.request(host)
        .put('/api/users/jonsu@mail.com')
        .send({
            tipe_users: 1
        })
        .end(() => {
            chai.request(host)
                .put(endpoint)
                .set('x-access-token', token)
                .send({
                    email_users: 'jonsu@mail.com'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eql(400);
                    res.body.should.have.property('message').eql('Sudah menjadi akun premium.');
                    
                    chai.request(host)
                        .put('/api/users/jonsu@mail.com')
                        .send({
                            tipe_users: user.tipe_users
                        })
                        .end(done);
                });      
        });
}).timeout(10000);

it('Not passed (without enough balance)', (done) => {
    chai.request(host)
        .put('/api/users/jonsu@mail.com')
        .send({
            saldo_users: -1,
            tipe_users: -1,
        })
        .end(() => {
            chai.request(host)
                .put(endpoint)
                .set('x-access-token', token)
                .send({
                    email_users: 'jonsu@mail.com'
                })
                .end((err, res) => {
                    res.should.have.status(400);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eql(400);
                    res.body.should.have.property('message').eql('Saldo tidak mencukupi.');
                    
                    chai.request(host)
                        .put('/api/users/jonsu@mail.com')
                        .send({
                            saldo_users: user.saldo_users,
                            tipe_users: user.tipe_users
                        })
                        .end(done);
                });      
        });
}).timeout(10000);

it('Passed', (done) => {
    chai.request(host)
        .put('/api/users/jonsu@mail.com')
        .send({
            tipe_users: -1,
        })
        .end(() => {
            chai.request(host)
                .put(endpoint)
                .set('x-access-token', token)
                .send({
                    email_users: 'jonsu@mail.com'
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    res.body.should.have.property('status').eql(200);
                    res.body.should.have.property('message').eql('Get premium akun berhasil!');
                    
                    chai.request(host)
                        .put('/api/users/jonsu@mail.com')
                        .send({
                            saldo_users: 200000,
                            tipe_users: user.tipe_users
                        })
                        .end(done);
                });      
        });
}).timeout(10000);






