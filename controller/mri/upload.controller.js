"use strict";

const fs = require('fs');
const atlasMakerServer = require('../atlasMakerServer/atlasMakerServer');
// ExpressValidator = require('express-validator')

var validator = function (req, res, next) {
    req.checkBody('url', 'please enter a valid URL')
        .notEmpty()
        .isURL();
    req.checkBody('atlasName', 'please enter an Atlas Name')
        .notEmpty()
        .isAlphanumeric();
    req.checkBody('atlasProject', 'please enter an Atlas Project')
        .notEmpty()
        .isAlphanumeric();
    req.checkBody('atlasLabelSet', 'please enter an Atlas Project')
        .notEmpty()
    req.checkBody('token', 'please enter an upload token')
        .notEmpty()
    /*
        Check for all these required fields:
        url: url
        atlas: a file
        atlasName: Alphanumeric string
        atlasProject: Alphanumeric string
        atlasLabelSet: One of the labels available inside the /public/labels/ directory
    */
    
    var errors = req.validationErrors();
    console.log("errors 33:",errors);
    if (errors) {
        return res.send(errors).status(403).end();
    } else {
        return next();
    }
};

var other_validations = function(req, res, next) {

    var token = req.body.token;
    req.db.get("log").findOne({"token":token})
    .then(function (obj) {
        if(obj) {
            // Check token expiry date
            var now = new Date();
            if(obj.expiryDate.getTime()-now.getTime() < req.tokenDuration) {
                req.db.get('mri').findOne({source:req.body.url, backup: {$exists: false}})
                .then(function (json) {
                    if (json && req.files.length > 0) {
                        req.atlasUpload = {
                            mri: json,
                            username: obj.username
                        };
                        next();
                    }
                    else {
                        var err = new Array();
                        if (req.files.length == 0 || !req.files) {err.push({error:"there is no File"});}
                        if (!json) {err.push({error:"Unkown URL"});}
                        console.log("err 63:",err);
                        return res.json(err).status(403).end();
                    }
                })
            } else {
                return res.send("ERROR: Token expired").status(403).end();
            }
        } else {
            return res.send("ERROR: Cannot find token").status(403).end();
        }                
    })
    .catch(function (err) {
        console.log("ERROR:",err);
        res.send().status(403).end();
    });
}

var upload = function(req, res) {
    var username = req.atlasUpload.username;
    var url = req.body.url;
    var mri = req.atlasUpload.mri;
    var atlasName = req.body.atlasName;
    var atlasProject = req.body.atlasProject;
    var atlasLabelSet = req.body.atlasLabelSet;
    var files = req.files;

    delete mri._id;

    console.log("Everything is in order");
    console.log("username:",username);
    console.log("url:", url);
    console.log("mri:", mri);
    console.log("atlasName:", atlasName);
    console.log("atlasProject:", atlasProject);
    console.log("atlasLabelSet:", atlasLabelSet);
    console.log("files:", files);

    // create final filename
    var ext;
    var filename;
    var dir, path;

    if(/.nii.gz$/.test(files[0].originalname)) {
        ext=".nii.gz";
    } else if(/.mgz$/.test(files[0].originalname)) {
        ext=".mgz";
    } else {
        return res.json({error:"Atlas encoding neither .nii.gz nor .mgz"}).status(400).end();
    }

    filename=Math.random().toString(36).slice(2)+ext;
    
    // check if directory exists (it may not exist if a volume annotation is being uploaded
    // for an mri that has only a db entry but has not yet been accessed)    
    dir = req.dirname + "/public" + mri.url;
    if(!fs.existsSync(dir)) {
        // directory does not exist, create it
        console.log("> mri directory did not exist, create it");
        fs.mkdirSync(dir, '0777');
    }

    // move tmp atlas file to final location
    path = dir + filename;
    try {
        fs.renameSync(req.dirname  + "/" + files[0].path, path);
    } catch(err) {
        console.log("ERROR rename failed:",err);
        return res.json({error:"cannot upload volume annotation"}).status(400).end();
    };

    // Check that the dimensions of the atlas are the same as its parent mri
    console.log("> load parent mri");
    atlasMakerServer.loadMRI(path)
    .then(function(atlas){
        console.log("atlas.dim: ",atlas.dim);
        console.log("mri.dim: ",mri.dim);

        /**
         * @todo How do we check for volume dimensions now?
         */
         
        /*
        // check volume dimensions
        if (atlas.dim[0] != mri.dim[0] ||
            atlas.dim[1] != mri.dim[1] ||
            atlas.dim[2] != mri.dim[2]) {
            return res.json({error:"the Atlas doesn't match with the mri"}).status(400).end();
        }
        */

        // create the atlas object
        var date = new Date();
        var atlasMetadata = {
            name: atlasName,
            project: atlasProject,
            access: "edit", 
            created: date.toJSON(), 
            modified: date.toJSON(), 
            filename: filename,	// automatically generated filename
            originalname: files[0].originalname,
            labels: atlasLabelSet,
            owner: username,
            type: "volume"
        };
        
        console.log("final volume annotation entry:");
        console.log("atlasMetadata:",atlasMetadata);

        // remove previous atlases with the same atlasName and atlasProject
        var i;
        for(i=mri.mri.atlas.length-1;i>=0;i--) {
            if(mri.mri.atlas[i].name == atlasName && mri.mri.atlas[i].project == atlasProject) {
                mri.mri.atlas.splice(i,1);
            }
        }

        // update the database
        mri.mri.atlas.push(atlasMetadata);
        // mark previous version as backup
        req.db.get('mri').update({source:req.body.url,backup:{$exists:false}},{$set:{backup:true}},{multi:true})
        .then(function() {
            // insert new version
            req.db.get('mri').insert(mri);
        });

        // return the full mri object ???
        return res.json(mri).status(200).end();
    })
    .catch(function (err) {
        console.log("ERROR: mri file is not valid: ",err);
        return res.json({error:"mri file is not valid: "+err}).status(400).end();
    });
}

var token = function token(req, res) {
    if (req.isAuthenticated()) {
        var obj = {},
            a = Math.random().toString(36).slice(2),
            b = Math.random().toString(36).slice(2),
            token, now, expiryDate;
        // token duration is set to 1 h in milliseconds
        // generate a random token
        obj.token = a + b;
        // expiration date: now plus tokenDuration milliseconds
        now = new Date();
        obj.expiryDate = new Date(now.getTime() + req.tokenDuration);
        // record the username
        obj.username = req.user.username;
        // store it in the database for the user
        req.db.get("log").insert(obj);
        
        /*
            // schedule its removal or log them forever?
            setTimer(function () {
                req.db.get("log").remove(obj);
            }, req.tokenDuration);
        */
        
        res.json(obj);
    } else {
        res.redirect('/');
    }
}

var uploadController = function () {
    this.validator = validator;
    this.other_validations = other_validations;
    this.upload = upload;
    this.token = token;
};

module.exports = new uploadController();

