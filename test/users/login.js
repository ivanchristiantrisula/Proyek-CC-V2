const server= require('../../server');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/login';

it('Not passed (without fields)', (done) => {
    chai.request(host)
        .post(endpoint)
        .send({
            email_users: undefined,
            password_users: undefined
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(400);
            res.body.should.have.property('message').eql('Field tidak boleh kosong!');
        done();
        });
}).timeout(10000);

it('Not passed (without correct email or password)', (done) => {
    chai.request(host)
        .post(endpoint)
        .send({
            email_users: 'test',
            password_users: 'test' 
        })
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(404);
            res.body.should.have.property('message').eql('E-mail atau password tidak ditemukan.');
        done();
        });
}).timeout(10000);

it('Passed', (done) => {
    chai.request(host)
        .post(endpoint)
        .send({
            email_users: 'jonsu@mail.com',
            password_users: 'asd' 
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(200);
            res.body.should.have.property('message').eql('Login berhasil.');
            res.body.should.have.property('token');
        done();
        });
}).timeout(10000);