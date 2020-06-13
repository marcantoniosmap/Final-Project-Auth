const app = require("../index");
const supertest= require('supertest');

test("GET /", done => {
  supertest(app)
    .get("/api/user")
    .expect(200, JSON.stringify({ status: "OK" }))
    .end(done)
})

app.close();
