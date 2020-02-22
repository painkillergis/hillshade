describe('service', function () {
  const chai = require('chai');
  const request = require('request-promise');
  chai.should();
  chai.use(require('chai-as-promised'));
  it('should greet me', async function () {
    await request({
      json: true,
      uri: 'http://localhost:8080',
    }).should.eventually.deep.equal({
      message: 'hello world',
    });
  });
});