const express = require('express');
const router = express.Router();

const mongodb = require('./../mongodb');
const ObjectId = require('mongodb').ObjectId;

router.get('/', function(req, res, next) {
    let data = req.body;
    let query = {};

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

router.get('/:id', function(req, res, next) {
    let query = {
        'id': req.params.id
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

router.post('/create', function(req, res) {
    let data = req.body;
    if(!data.lobby_name || !data.user_id) {
        return res.end();
    }

    let object = {
        'id': 0,
        'host': ObjectId(data.user_id),
        'name': data.lobby_name,
        'members': [],
        'requests': [],
        'invites': []
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.insertOne(object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/delete', function(req, res) {
    let data = req.body;
    let query = {
        'id': req.params.id
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.deleteOne(query, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/invite', function(req, res) {
    let data = req.body;
    if(!data.user_id) {
        return res.end();
    }

    let query = {
        'id': req.params.id
    };
    let object = {
        '$push': {'invites': ObjectId(data.user_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/request', function(req, res) {
    let data = req.body;
    if(!data.user_id) {
        return res.end();
    }

    let query = {
        'id': req.params.id
    };
    let object = {
        '$push': {'requests': ObjectId(data.user_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/rename', function(req, res) {
    let data = req.body;
    if(!data.name) {
        return res.end();
    }

    let query = {
        'id': req.params.id
    };
    let object = {
        '$set': {'name': data.name}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/members/:member_id/delete', function(req, res) {
    let data = req.body;
    let query = {
        'id': req.params.id
    };
    let object = {
        '$pull': {'members': ObjectId(req.params.member_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/invites/:invite_id/accept', function(req, res) {
    let query = {
        'id': req.params.id
    };
    let object = {
        '$push': {'members': ObjectId(req.params.invite_id)},
        '$pull': {'invites': ObjectId(req.params.invite_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/invites/:invite_id/reject', function(req, res) {
    let query = {
        'id': req.params.id
    };
    let object = {
        '$pull': {'invites': ObjectId(req.params.invite_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/requests/:request_id/accept', function(req, res) {
    let query = {
        'id': req.params.id
    };
    let object = {
        '$push': {'members': ObjectId(req.params.request_id)},
        '$pull': {'requests': ObjectId(req.params.request_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

router.post('/:id/requests/:request_id/reject', function(req, res) {
    let query = {
        'id': req.params.id
    };
    let object = {
        '$pull': {'requests': ObjectId(req.params.request_id)}
    };

    mongodb(function(client, close) {
        const db = client.db('ds_users');
        const collection = db.collection('lobbies');
        collection.updateOne(query, object, function(err, result) {
            if(err) console.log(err);
            res.send(result);
            close();
        });
    });
});

module.exports = router;
