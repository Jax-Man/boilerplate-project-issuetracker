'use strict';
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
module.exports = function (app) {
  let input;
  let issueCollection;
  const idRegex = /[a-z0-9]{24}/i;
  // initialize MongoClient
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);
  const db = client.db('issue_tracker');
  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      let project = req.params.project;
      issueCollection = db.collection(project);
      let searchQuery = req.query;
      for (let key in searchQuery) {
        if (searchQuery.hasOwnProperty(key)) { // Ensure it's the object's own property
          if (key === '_id') {
            searchQuery[key] = new ObjectId(searchQuery[key]);
          } else if (key === 'open') {
            searchQuery[key] = searchQuery[key] === 'true' ? true : false;
          } 
        }
      };

      try {    
        if (Object.keys(searchQuery).length > 0) {
          const queriedIssuesArray = await issueCollection.find(searchQuery).toArray();
          return res.json(queriedIssuesArray);
        };
        const issuesArray = await issueCollection.find({}).toArray();
        return res.json(issuesArray);
      } catch (err) {
        return res.json({error: err, message: 'oops please try again'});
      }
    })
    
    .post(async function (req, res){
      let project = req.params.project;
      let dateCreated = new Date();
      
      issueCollection = db.collection(project);

      input = { 
        issue_title: req.body.issue_title, 
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        status_text: req.body.status_text || '',
        created_on: dateCreated,
        updated_on: dateCreated,
        open: true
      };
      if (!input.issue_title || !input.issue_text || !input.created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      try {
        const issue = await issueCollection.insertOne(input);
          
        if (issue) {
            
          const foundTicket = await issueCollection.findOne({ _id: issue.insertedId });
          res.json(foundTicket);
        };
      } catch (err) {
     
        return res.json({ error: 'failed to add issue. please try again'})
      }; 
    })
    
    .put(async function (req, res){
      let project = req.params.project;
      issueCollection = db.collection(project);
     
      try {
      if (!req.body._id) {
          return res.json({ error: 'missing _id'});
          
      } else if(!idRegex.test(req.body._id)) {  
        return res.json({ error: 'could not update', '_id': req.body._id });
      } else if ( 
        !req.body.issue_title 
        && !req.body.issue_text
        && !req.body.created_by 
        && !req.body.assigned_to
        && !req.body.status_text 
        && !req.body.open) {
          return res.json( { error: 'no update field(s) sent', '_id': req.body._id } );
      } else {
        const issueToUpdate = await issueCollection.findOne({_id: new ObjectId(req.body._id)});

        if (!issueToUpdate) {
          return res.json({ error: 'could not update', '_id': req.body._id });
        };

        let updated = await issueCollection.findOneAndUpdate( {_id: new ObjectId(req.body._id)},
          { $set: { 
            issue_title: req.body.issue_title || issueToUpdate.issue_title,
            issue_text: req.body.issue_text || issueToUpdate.issue_text,
            created_by: req.body.created_by || issueToUpdate.created_by,
            assigned_to: req.body.assigned_to || issueToUpdate.assigned_to,
            status_text: req.body.status_text || issueToUpdate.status_text,
            updated_on: new Date(),
            open: req.body.open === 'true' ? true : false
          } } 
        );

        if (updated) {
          return res.json({  result: 'successfully updated', '_id': req.body._id })
        } else {
          return res.json({ error: 'could not update', '_id': req.body._id })
        }
        }
      } catch (err) {
        console.log(err);
        return res.json({ error: 'could not update', '_id': req.body._id });
      }
    })
    
    .delete(function (req, res){
      let project = req.params.project;
      issueCollection = db.collection(project);
      let _id = '';
      let issueToDelete = '';
      if (!req.body._id) {return res.json({ error: 'missing _id' });
      } else if (!idRegex.test(req.body._id)) {
        return res.json({ error: 'could not delete', '_id': req.body._id })
      } else { 
        
        _id = req.body._id;
        issueToDelete = new ObjectId(req.body._id);
      };
      
      async function deleteIssue() {
        try {
      
        const deletedIssue = await issueCollection.findOneAndDelete({ "_id": issueToDelete });
       
        if (deletedIssue) {
        return res.json({ result: 'successfully deleted', '_id': _id });
        } else {
          return res.json({ error: 'could not delete', '_id': _id});
        }
        } catch(err) {
          console.log(err);
          return res.json({ error: 'could not delete', '_id': _id});
        }
      };

      deleteIssue();

    });
    
};
