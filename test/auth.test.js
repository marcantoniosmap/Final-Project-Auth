const supertest= require('supertest');
const http = require('http');
const { app, mongoose } = require('../server');

describe("demo test", () => {
  let server, request;
  
  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(done);
    request = supertest(server);
  });

  afterAll(done => {
    server.close(done);
    mongoose.disconnect();
  })

  it('returns 200', async() =>{
    const response = await request.get('/api/user');
    expect(response.status).toBe(200);
  });
});
