const express = require('express');
const router = express.Router();

const mongodb = require('./../mongodb').twitter;

router.post('/get-tweets', (req, res) => {
    const page_size = req.body.page_size;
    const page_no = req.body.page_no;
    const collect = req.body.collection;
    if(!page_size || !page_no || !collect) 
        return res.end();
    mongodb(function(client, close) {
        const db = client.db('tweets');
        const collection = db.collection(collect);
        collection.find({}).skip(page_size*(page_no - 1)).limit(page_size).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

module.exports = router;