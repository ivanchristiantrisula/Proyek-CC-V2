const server= require('../../server');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;
const endpoint= '/api/users/register';

it('Not passed (without fields)', (done) => {
    chai.request(host)
        .post(endpoint)
        .send({
            email_users: undefined,
            nama_users: undefined,
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

it('Not passed (without valid e-mail)', (done) => {
    chai.request(host)
        .post(endpoint)
        .send({
            email_users: 'test@',
            nama_users: 'test',
            password_users: 'asd'
        })
        .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(400);
            res.body.should.have.property('message').eql('E-mail tidak valid!');
        done();
        });
}).timeout(10000);

it('Passed', (done) => { //HARUS VALID,
    chai.request(host)
        .post(endpoint)
        .send({
            email_users: 'test@mail.com',
            nama_users: 'test',
            password_users: 'asd'
        })
        .end((err, res) => {
            res.should.have.status(200);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(200);
            res.body.should.have.property('message').eql('Register berhasil!');

            chai.request(host) //CALLBACK REQUEST
                .delete('/api/users/test@mail.com')
                .end(done);
            });
}).timeout(10000);