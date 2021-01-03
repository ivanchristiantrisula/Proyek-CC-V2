const server= require('../../server');
const verifyToken= require('../../modules/verifyToken');

const chai= require('chai');
const chaiHttp= require('chai-http');

chai.should(); //ASSERTION STYLE
chai.use(chaiHttp);

const host= server.production;

const getRequest= (endpoint, method) => {
    let request;

    if (method === 'GET') {
        request= chai.request(host)
                     .get(endpoint);
    } else if (method === 'POST') {
        request= chai.request(host)
                     .post(endpoint);
    } else if (method === 'PUT') {
        request= chai.request(host)
                     .put(endpoint);
    } else if (method === 'DELETE') {
        request= chai.request(host)
                     .delete(endpoint);
    }

    return request;
};

module.exports.withoutToken= (endpoint, method) => {
    it('Not passed (without token)', (done) => {
        getRequest(endpoint, method).end((err, res) => {
            const verified= verifyToken();
            
            res.should.have.status(verified.status);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(verified.status);
            res.body.should.have.property('message').eql(verified.message);
        done();
        });
    }).timeout(10000);
};

module.exports.withOutValidToken= (endpoint, method) => {
    it('Not passed (without valid token)', (done) => {
        getRequest(endpoint, method).set('x-access-token', 'test')
                                    .end((err, res) => {
            const verified= verifyToken('test');
            
            res.should.have.status(verified.status);
            res.body.should.be.a('object');
            res.body.should.have.property('status').eql(verified.status);
            res.body.should.have.property('message').eql(verified.message);
        done();
        });
    }).timeout(10000);
};