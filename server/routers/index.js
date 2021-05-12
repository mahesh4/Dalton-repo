const express = require('express');
const router = express.Router();

const mongodb = require('./../mongodb').remoteMongo;
const ObjectId = require('mongodb').ObjectId;


router.post('/dsfr', function(req, res, next) {
    let data = req.body;
    if(!data.parent || !data.timestamp) {
        return res.end();
    }

    for(let i = 0; i < data.parent.length; i++) {
        data.parent[i] = ObjectId(data.parent[i]);
    }

    let query = {
        parent: {$in: data.parent},
        timestamp: parseInt(data.timestamp)
    };

    mongodb(function(client, close) {
        const db = client.db('ds_results');
        const collection = db.collection('dsfr');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

router.post('/dsir_old', function(req, res, next) {
    let data = req.body;
    if(!data.workflow_id) {
        return res.end();
    }

    let query = {
        //'parents': {'$ne': null},
        'metadata.workflow_id': ObjectId(data.workflow_id)
    };

    if(data.model_types) {
        query = {
            //'parent': {'$ne': null},
            'metadata.workflow_id': ObjectId(data.workflow_id),
            'metadata.model_type': {'$in': data.model_types}
        };
    }

    mongodb(function(client, close) {
        const db = client.db('ds_results');
        const collection = db.collection('dsir');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

router.post('/dsfr_test', function(req, res, next) {
    let data = req.body;

    mongodb(function(client, close) {
        const db = client.db('ds_results');
        const collection = db.collection('dsfr');
        collection.aggregate([
            /*{$match: {
                    parent: {$in: ObjectId(results[i]['_id'])}
                }},*/ /*{
                $addFields: {
                    avg: [ { $avg: { $arrayElemAt: [ "$observation", 0 ] } }, { $avg: { $arrayElemAt: [ "$observation", 1 ] } }, { $avg: { $arrayElemAt: [ "$observation", 2 ] } } ],
                    max: [ { $max: "$observation.0" }, { $max: "$observation.1" }, { $max: "$observation.2" } ],
                    min: [ { $min: "$observation.0" }, { $min: "$observation.1" }, { $min: "$observation.2" } ]
                }
            },*/
            {
                $unwind: "$observation"
            },
            {
                $group: {
                    _id: "$_id",
                    observation_0: {$first: "$observation"},
                    observation_1: {$first: "$observation"},
                    observation_2: {$last: "$observation"}
                }
            },
            {
                $group: {
                    _id: "$parent",
                    avg_0: {$avg: "$observation_0"},
                    avg_1: {$avg: "$observation_1"},
                    avg_2: {$avg: "$observation_2"}
                }
            }
        ]).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

router.post('/dsir', function(req, res, next) {
    let data = req.body;
    if(!data.workflow_id) {
        return res.end();
    }

    let query = {
        'metadata.workflow_id': ObjectId(data.workflow_id)
    };

    mongodb(function(client, close) {
        const db = client.db('ds_results');
        const collection = db.collection('dsir');
        collection.aggregate([
            {
                $lookup: {
                    from: "dsfr",
                    localField: "_id",
                    foreignField: "parent",
                    as: "dsfrs"
                }
            }
        ]).toArray(function(err, results) {
            if (err) console.log(err);
            for(let i = 0; i < results.length; i++) {
                let dsir = results[i];
                let stats = {};
                for(let j = 0; j < dsir.dsfrs.length; j++) {
                    let dsfr = dsir.dsfrs[j];
                    let type = dsfr.model_type;

                    if(!stats[type]) {
                        stats[type] = {
                            avg: [],
                            avg_count: [],
                            max: [],
                            min: [],
                            avg_abs: [],
                            avg_abs_count: [],
                            max_abs: [],
                            min_abs: []
                        };
                    }

                    for(let k = 0; k < dsfr.observation.length; k++) {
                        if(!stats[type].avg[k]) stats[type].avg[k] = 0;
                        if(!stats[type].avg_count[k]) stats[type].avg_count[k] = 0;
                        if(!stats[type].max[k]) stats[type].max[k] = dsfr.observation[k];
                        if(!stats[type].min[k]) stats[type].min[k] = dsfr.observation[k];

                        if(!stats[type].avg_abs[k]) stats[type].avg_abs[k] = 0;
                        if(!stats[type].avg_abs_count[k]) stats[type].avg_abs_count[k] = 0;
                        if(!stats[type].max_abs[k]) stats[type].max_abs[k] = dsfr.observation[k];
                        if(!stats[type].min_abs[k]) stats[type].min_abs[k] = dsfr.observation[k];

                        stats[type].avg[k] += dsfr.observation[k];
                        stats[type].avg_count[k] += 1;
                        if(stats[type].max[k] < dsfr.observation[k]) stats[type].max[k] = dsfr.observation[k];
                        if(stats[type].min[k] > dsfr.observation[k]) stats[type].min[k] = dsfr.observation[k];

                        stats[type].avg_abs[k] += Math.abs(dsfr.observation[k]);
                        stats[type].avg_abs_count[k] += 1;
                        if(Math.abs(stats[type].max_abs[k]) < Math.abs(dsfr.observation[k])) stats[type].max_abs[k] = dsfr.observation[k];
                        if(Math.abs(stats[type].min_abs[k]) > Math.abs(dsfr.observation[k])) stats[type].min_abs[k] = dsfr.observation[k];
                    }

                }
                for(let type in stats) {
                    for(let k = 0; k < stats[type].avg.length; k++) {
                        stats[type].avg[k] /= stats[type].avg_count[k];
                        stats[type].avg_abs[k] /= stats[type].avg_abs_count[k];
                    }
                }
                results[i]['metadata']['statistics'] = stats;
                delete results[i]['dsfrs'];
            }
            res.send(results);
            close();
        });
    });
});

router.get('/workflows', function(req, res, next) {
    let data = req.body;
    let query = {};

    mongodb(function(client, close) {
        const db = client.db('ds_config');
        const collection = db.collection('collection');
        collection.find(query).toArray(function(err, results) {
            if(err) console.log(err);
            res.send(results);
            close();
        });
    });
});

router.post('/dsfr-custom', function(req, res, next) {
    console.log("post request at route results/dsfr-custom");
    let data = req.body.columns;
    let query = {};
    for (var field in data) {
        query[data[field]] = true;
    }
    mongodb(function(client, close) {
        const db = client.db('ds_results');
        const collection = db.collection('dsfr');
        collection.find({}).project(query).toArray(function(err, results) {
            if(err) console.err(err);
            res.send(results);
            close();
        });
    });
});

module.exports = router;
