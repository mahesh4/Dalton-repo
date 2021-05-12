const express = require('express');
const shell = require('shelljs');
const router = express.Router();
const mongodb = require('./../mongodb').remoteMongo;
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname + '/uploads'))
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '.py')
    }
  });

// const upload_des = multer({
//     storage: storage,
//     fileFilter: function(req, file, callback) {
//         var ext = path.extname(file.originalname);
//         if(ext !== '.kar' && ext !== '.py') {
//             return callback(new Error('Only filetypes of .kar are allowed'));
//         }
//         callback(null, true);
//     }

// });

const upload_des = multer({
    storage: storage,

});

router.post('/status',async (req, res) => {

    console.log('received post call at shell/status path');
    console.log(req.body);
    let user = req.body.user;


    var mongo_promise = new Promise((resolve, reject) => {
        let response = [];
        try {
            mongodb(async function(client, close) {
                const db = client.db('ds_tasks');
                const collection = db.collection('ucmds');
                const jobs = await collection.find({'user': user}).toArray();
    
                for(var i=0; i < jobs.length; i++) {
                    if( jobs[i]['status'] == 'running' ) {
                        let process_id = jobs[i]['process_id'];
                        const { stdout, stderr, code } = shell.exec('ps aux ' + process_id,  { silent: true } )
                        /* The process has completed */
                        if( stdout.split("\n")[1].length == 0 ) {
                            console.log(process_id + " process has completed");
                            await collection.update({'user': user, 'process_id': process_id }, {$set: {'status': "completed"}});  
                            jobs[i]['status'] = "completed";
                        }
                        /* A process with the same process_id is still running */
                        else {
                            console.log(process_id + " process is still running");
                            /* check whether the process_id got recycled */
                            stdout_string = stdout.split("\n");
                            for(j = stdout_string.length-1; j--;) {
                                if ( stdout_string[j] === '') stdout_string.splice(j, 1);
                            }
                            process_id = stdout_string[1];
                            start_time = stdout_string[8];

                            /* The process_id got recycled, the check id done by comparing the start times of the process_id with the recorded start time in the MongoDB */
                            if(start_time > jobs[i]['start_time']) {
                                await collection.update({'user': user, 'process_id': results[i]['process_id']}, {$set: {'status': "completed"}});
                                jobs[i]['status'] = 'completed';
                            }
                        }
                    }
                }
                close();
                resolve(jobs);
            });
        } catch(err) {
            reject(err)
        }
        
    });
     

    mongo_promise.then((response) => {
        console.log('completed mongodb call');
        res.status(200).send(response);
    }).catch((err) => {
        res.status(503).send(err)
    })
    
});

router.post('/run', upload_des.single('karfile'), (req, res) => {
    console.log('received post call at shell/run path');
    const command = req.body.command.trim();
    const user = req.body.user.trim();
    const kar_file = req.file.path;
    var cmd = shell.exec(command + ' ' + kar_file, {async:true, silent:true});
    console.log('process started at ' + cmd['pid']);
    var promise = new Promise((resolve, reject) => {
        try {
            
            shell.exec('ps aux ' + cmd['pid'], async function(code, stdout, stderr) {
                stdout_string = stdout.split("\n");
                stdout_string = stdout_string[1].split(" ");
                for( var i = stdout_string.length-1; i--;) {
                    if ( stdout_string[i] === '') stdout_string.splice(i, 1);
                }
                process_id = stdout_string[1];
                start_time = stdout_string[8];
                console.log(process_id + " " + start_time)
                await mongodb(async function(client, close) {
                    const db = client.db('ds_tasks');
                    const collection = db.collection('ucmds');
                    await collection.insertOne({'user': user, 'process_id': process_id, 'start_time': new Date(), 'status': 'running', 'command': command});
                    close();
                    resolve('started the process');
                });
    
            });
            
        } catch(error) {
            reject(error)
        }


    });
    promise.then((response) => {
        res.status(200).send('started the process');
    }).catch((err) => {
        res.status(503).send(err)
    })
});

router.post('/update', (req, res) => {
    console.log('update path invoked');
    console.log(req.body)
    user = req.body.user.trim()
    var mongo_promise = new Promise((resolve, reject) => {
        try{
            mongodb(async(client, close) => {
                const db = client.db('ds_tasks');
                const collection = db.collection('ucmds');
                
                for (i=0; i<req.body['delete'].length; i++) {
                    await collection.deleteOne({'user': user, 'process_id': req.body['delete'][i]});
                }
                for (i=0; i<req.body['stop'].length; i++) {
                    cmd = shell.exec('kill -9 ' + req.body['stop'][i], {async: true});
                    await collection.update({'user': user, 'process_id': process_id }, {$set: {'status': "stopped"}}); 
                }
                close();
                resolve('success'); 
            })
        } catch(error) {
            reject(error);
        }
    });
    mongo_promise.then((response) => {
        res.status(200).send(response)
    }).catch((error) => {
        res.status(503).send(error)
    })
});

module.exports = router;