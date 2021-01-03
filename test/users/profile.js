const server= require('../../server');
const tokenTest= require('../util/tokenTest');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/profile';
const method= {
    GET: 'GET',
    PUT: 'PUT'
};

let token;

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

describe('/get', () => {
    tokenTest.withoutToken(endpoint, method.GET);
    tokenTest.withOutValidToken(endpoint, method.GET);
    
    it('Passed', (done) => {
        chai.request(host)
            .get(endpoint)
            .set('x-access-token', token)
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('profile').should.be.a('object');
            done();
            });
    }).timeout(10000);
});

describe('/put', () => {
    tokenTest.withoutToken(endpoint, method.PUT);
    tokenTest.withOutValidToken(endpoint, method.PUT);
    
    it('Not passed (without fields)', (done) => {
        chai.request(host)
            .put(endpoint)
            .set('x-access-token', token)
            .send({
                nama_users: undefined,
                old_password_users: undefined,
                confirm_password_users: undefined,
                new_password_users: undefined
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('Field tidak boleh kosong!');
            done();
            });
    }).timeout(10000);

    it('Not passed (new password not equal with confirm password)', (done) => {
        chai.request(host)
            .put(endpoint)
            .set('x-access-token', token)
            .send({
                nama_users: 'test',
                old_password_users: 'dsa',
                new_password_users: 'dsa',
                confirm_password_users: 'asd'
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.be.a('object');
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('Password baru tidak sama dengan confirm password.');
            done();
            });
    }).timeout(10000);

    it('Not passed (without valid old password)', (done) => {
        chai.request(host)
            .put(endpoint)
            .set('x-access-token', token)
            .send({
                nama_users: 'test',
                old_password_users: 'test',
                new_password_users: 'dsa',
                confirm_password_users: 'dsa'
            })
            .end((err, res) => {
                res.should.have.status(400);
                res.body.should.have.property('status').eql(400);
                res.body.should.have.property('message').eql('Password lama tidak sesuai.');
            
            done();
            });
    }).timeout(10000);

    it('Passed', (done) => {
        chai.request(host)
            .put(endpoint)
            .set('x-access-token', token)
            .send({
                nama_users: 'test',
                old_password_users: 'asd',
                new_password_users: 'test',
                confirm_password_users: 'test'
            })
            .end((err, res) => {
                res.should.have.status(200);
                res.body.should.have.property('status').eql(200);
                res.body.should.have.property('message').eql('Ubah profile berhasil!');

                chai.request(host)
                    .put(endpoint)
                    .set('x-access-token', token)
                    .send({
                        nama_users: 'jonsu',
                        old_password_users: 'test',
                        new_password_users: 'asd',
                        confirm_password_users: 'asd'
                    })
                    .end(done);
            });
    }).timeout(10000);
});