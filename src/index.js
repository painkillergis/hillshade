typeof describe === 'undefined' || describe('service', function () {
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
  after(function () {
    server.close();
  });
});


const app = require('express')();
app.get('/', (ignored, response) => {
  response.json({
    message: 'hello world',
  });
});
const server = app.listen(8080, () => console.log('0.0.0.0:8080'));