const MongoClient = require('mongodb').MongoClient;
const tunnel = require('tunnel-ssh');

let config = {
    username: 'cc',
    password: '',
    privateKey: require('fs').readFileSync('dsworker_rsa'),
    host: '129.114.27.85',
    port: 22,
    dstHost: '127.0.0.1',
    dstPort: 27017,
    localHost: '127.0.0.1',
    localPort: 8988
};

let twitter_config = {
    username: 'cc',
    password: '',
    privateKey: require('fs').readFileSync('ds-twitter.pem'),
    dstHost: '127.0.0.1',
    host: '129.114.109.54',
    localHost: '127.0.0.1',
    port: 22,
    dstPort: 27017,
    localPort: 9000
    
};

module.exports.localHost = function(callback) {
    (async function () {
        try {
            const client = await MongoClient.connect('mongodb://127.0.0.1:27017', { useUnifiedTopology: true, useNewUrlParser: true  });
            callback(client, function() {
                client.close();
            });
        } catch(e) {
            console.error(e);
        }
    })();
};

module.exports.remoteMongo = function(callback) {
    tunnel(config, function(err, server) {
        if(err) console.error(err);
        (async function () {
            try {
                const client = await MongoClient.connect('mongodb://' + config.localHost + ':' + config.localPort,
                    {useUnifiedTopology: true, useNewUrlParser: true});
                callback(client, function() {
                    client.close();
                    server.close();
                });
            } catch(e) {
                console.error(e);
                server.close();
            }
        })();
    }).on('error', function(err) {
        console.error(err);
    });
};

module.exports.twitter = function(callback) {
    tunnel(twitter_config, function(err, server) {
        if(err) console.error(err);
        (async function () {
            try {
                const client = await MongoClient.connect('mongodb://localhost:9000', { useUnifiedTopology: true, useNewUrlParser: true  });
                callback(client, function() {
                    client.close();
                    server.close();
                });
            } catch(e) {
                console.error(e);
                server.close();
            }
        })();
    }).on('error', function(err) {
        console.error(err);
    });
};

