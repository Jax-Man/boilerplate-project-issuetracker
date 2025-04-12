const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const db = client.db('issue_tracker');

chai.use(chaiHttp);
let testId = '';
let testIdToObject = '';
let testTitle = 'Jerry has issues+1';
let testText = 'Too many to list hes working on them though!';
let testCreator = 'Jerry';
let testAssigned = 'me';
let testStatus = 'Life-long';
let testopen = true;
suite('Functional Tests', function() {
      // #1
      test('Test POST /api/issues/apitest with All fields', function (done) {
        chai
          .request(server)
          .post("/api/issues/apitest")
          .set("content-type", "application/json")
          .send({
            issue_title: testTitle,
            issue_text: testText,
            created_by: testCreator,
            assigned_to: testAssigned,
            status_text: testStatus,
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            testId = res.body._id;
            testIdToObject = new ObjectId(testId);
            assert.equal(res.body.issue_title, testTitle);
            assert.equal(res.body.assigned_to, testAssigned);
            assert.equal(res.body.created_by, testCreator);
            assert.equal(res.body.status_text, testStatus);
            assert.equal(res.body.issue_text, testText);
            assert.equal(res.body.open, true);
            done();
          });
      });
        //#2
        test('POST request with only required fields', function (done) {
            chai
            .request(server)
            .post("/api/issues/apitest")
            .set("content-type", "application/json")
            .send({
                issue_title: testTitle,
                issue_text: testText,
                created_by: testCreator
            })
            .end(function (err, res) {
                assert.equal(res.status, 200);
                testId = res.body._id;
                testIdToObject = new ObjectId(testId);
                assert.equal(res.body.issue_title, testTitle);
                assert.equal(res.body.assigned_to, '');
                assert.equal(res.body.created_by, testCreator);
                assert.equal(res.body.status_text, '');
                assert.equal(res.body.issue_text, testText);
                assert.equal(res.body.open, true);
                done();
            });
        });
        //#3
        test('POST request with only required fields', function (done) {
            chai
              .request(server)
              .post("/api/issues/apitest")
              .set("content-type", "application/json")
              .send({
                issue_title: testTitle,
                issue_text: testText,
              })
              .end(function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'required field(s) missing');
                done();
              });
        });
        //#4
        test('GET request to api/issues/apitest', function (done) {
            chai
              .request(server)
              .get("/api/issues/apitest")
              .end(async function (err, res) {
                const fullIssueArray = await db.collection('apitest')
                    .find()
                    .toArray();

                assert.equal(res.status, 200);
                assert.equal(res.body.length, fullIssueArray.length);
                done();
              });
        });
        //#5
        test('GET request to api/issues/apitest with 1 filter', function (done) {
            chai
              .request(server)
              .get("/api/issues/apitest")
              .query({
                issue_text: testText
              })
              .end(async function (err, res) {
                const filteredIssueArray = await db.collection('apitest')
                    .find({
                        issue_text: testText
                      })
                    .toArray();

                assert.equal(res.status, 200);
                assert.equal(res.body.length, filteredIssueArray.length);
                done();
              });
        });
        //#6
        test('GET request to api/issues/apitest with 2 filters', function (done) {
            chai
              .request(server)
              .get("/api/issues/apitest")
              .query({
                issue_text: testText,
                issue_title: testTitle
              })
              .end(async function (err, res) {
                const filteredIssueArray = await db.collection('apitest')
                    .find({
                        issue_text: testText,
                        issue_title: testTitle
                      })
                    .toArray();

                assert.equal(res.status, 200);
                assert.equal(res.body.length, filteredIssueArray.length);
                done();
              });
        });
        //#7
        test('PUT update request to api/issues/apitest with 1 field', function (done) {
            chai
              .request(server)
              .put("/api/issues/apitest")
              .send({
                    _id: testId,
                    issue_text: "this is update test"
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.result, 'successfully updated');
                assert.equal(res.body._id, testId);
                done();
              });
        });
        //#8
        test('PUT update request to api/issues/apitest with 3 fields', function (done) {
            chai
              .request(server)
              .put("/api/issues/apitest")
              .send({
                    _id: testId,
                    issue_text: "this is update test",
                    issue_title: "updated test",
                    assigned_to: "Update Joe"
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.result, 'successfully updated');
                assert.equal(res.body._id, testId);
                done();
              });
        });
        //#9
        test('PUT update request to api/issues/apitest with 1 field and no _id', function (done) {
            chai
              .request(server)
              .put("/api/issues/apitest")
              .send({
                    issue_text: "this is update test"
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'missing _id');
                done();
              });
        });
        //#10
        test('PUT update request to api/issues/apitest with 0 fields', function (done) {
            chai
              .request(server)
              .put("/api/issues/apitest")
              .send({
                _id: testId
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'no update field(s) sent');
                assert.equal(res.body._id, testId);
                done();
              });
        });
        //#11
        test('PUT update request to api/issues/apitest with incorrect _id', function (done) {
            chai
              .request(server)
              .put("/api/issues/apitest")
              .send({
                _id: '23'
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'could not update');
                assert.equal(res.body._id, '23');
                done();
              });
        });
        //#12
       test('DELETE request to /api/issues/apitest', function (done) {
            chai
              .request(server)
              .delete("/api/issues/apitest")
              .set("Content-Type", "application/json")
              .send({
                '_id': testId
              })
              .end(async function (err, res) {
                assert.equal(res.status, 200);
                assert.equal(res.body.result, 'successfully deleted');
                assert.equal(res.body._id, testId);
                done();
              });
        });  
        //#13      
        test('invalid _id DELETE request to /api/issues/apitest', function (done) {
            chai
              .request(server)
              .delete("/api/issues/apitest")
              .set("Content-Type", "application/json")
              .send({
                _id: '23'
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'could not delete');
                assert.equal(res.body._id, '23');
                done();
              });
        });
        //#14
        test('DELETE request to /api/issues/apitest with no _id', function (done) {
            chai
              .request(server)
              .delete("/api/issues/apitest")
              .set("Content-Type", "application/json")
              .send({
              })
              .end(async function (err, res) {

                assert.equal(res.status, 200);
                assert.equal(res.body.error, 'missing _id');
                done();
              });
        });
});
