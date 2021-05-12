const express = require('express');
const router = express.Router();

const mongodb = require('./../mongodb');
const ObjectId = require('mongodb').ObjectId;

router.get('/', function(req, res, next) {
    let data = req.body;
    let query = {};
    res.end();
    /*mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });*/
});

router.get('/:id', function(req, res, next) {
    let query = {
        'id': req.params.id
    };
    res.end();
    /*mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('users');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });*/
});

module.exports = router;
