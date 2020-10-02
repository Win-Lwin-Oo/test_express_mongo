const express = require('express');
const app = express();

const mongojs = require('mongojs');
const db = mongojs('travel', ['records']);

const bodyParser = require('body-parser');

const { body, param, validationResult } = require('express-validator');

const cors = require('cors');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors()); // allow all CORS request

// If CORS want to allow spectific host(origin),domain,port
// app.use(cors({
//     origin: ["http://a.com", "http://b.com"],
//     methods: ["GET", "POST"],
//     allowHeaders: ["Authorization", "Content-Type"]
// }));

// allow all CORS (Cross-Origin Resource Sharing) request by using middleware (app.use())
// app.use(function (req, res, next) {
//     res.append("Access-Control-Allow-Origin", "*");
//     res.append("Access-Control-Allow-Methods", "*");
//     res.append("Access-Control-Allow-Headers", "*");
//     next();
// });

// get all
app.get('/api/records', function (req, res) {

    // allow CORS request
    // res.append("Access-Control-Allow-Origin", "*");
    // res.append("Access-Control-Allow-Methods", "*");
    // res.append("Access-Control-Allow-Headers", "*");

    const options = req.query;
    const sort = options.sort || {};
    const filter = options.filter || {};
    const limit = 10;
    const page = parseInt(options.page) || 1;
    const skip = (page - 1) * limit;

    for (i in sort) {
        sort[i] = parseInt(sort[i]);
    }

    db.records.find(filter).sort(sort)
        .skip(skip)
        .limit(limit, function (err, data) {
            if (err) {
                return res.sendStatus(500);
            } else {
                return res.status(200).json({
                    meta: {
                        skip,
                        limit,
                        sort,
                        filter,
                        page,
                        total: data.length,
                    },
                    data,
                    links: {
                        self: req.originalUrl,
                    }
                });
            }
        });
});

// get by _id
app.get("/api/records/:id", [
    param("id").isMongoId(),
], function (req, res) {
    const _id = req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            const option = {
                _id: mongojs.ObjectId(_id),
            }
            db.records.find(option, function (err, data) {
                if (err) {
                    return res.sendStatus(500);
                } else {
                    return res.status(200).json({
                        meta: { total: data.length },
                        data
                    });
                }
            });
        } else if (err) {
            return res.sendStatus(500);
        }
    });
});

// create new data
app.post('/api/records', [
    body('name').not().isEmpty(),
    body('from').not().isEmpty(),
    body('to').not().isEmpty()
], function (req, res) {
    // validate options, send 400 on error
    // 400 is client request error code
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.records.insert(req.body, function (err, data) {
        if (err) {
            return res.status(500);
        } else {
            const _id = data._id
            res.append("Location", "/api/records/" + _id);
            return res.status(201).json({ meta: { _id }, data });
        }
    });
});

// update and overrite all data by _id and if data not have, create new data
app.put("/api/records/:id", [
    param("id").isMongoId(),
], function (req, res) {
    const _id = req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            const record = {
                _id: mongojs.ObjectId(_id), ...req.body
            };
            db.records.save(record, function (err, data) {
                return res.status(200).json({
                    meta: { _id },
                    data
                });
            });
        } else {
            db.records.save(req.body, function (err, data) {
                return res.status(201).json({
                    meta: { _id: data._id },
                    data
                });
            });
        }
    });
});

// update specific data
app.patch("/api/records/:id", function (req, res) {
    const _id = req.params.id;
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            db.records.update(
                { _id: mongojs.ObjectId(_id) },
                { $set: req.body },
                { multi: false },
                function (err, data) {
                    db.records.find({
                        _id: mongojs.ObjectId(_id)
                    }, function (err, data) {
                        return res.status(200).json({
                            meta: { _id }, data
                        });
                    });
                }
            )
        } else {
            return res.sendStatus(404);
        }
    });
});

// remove data by _id
app.delete("/api/records/:id", function (req, res) {
    const _id = req.params.id;
    db.records.count({
        _id: mongojs.ObjectId(_id)
    }, function (err, count) {
        if (count) {
            db.records.remove({
                _id: mongojs.ObjectId(_id)
            }, function (err, data) {
                return res.sendStatus(204);
            });
        } else {
            return res.sendStatus(404);
        }
    });
});

app.listen(8080, function () {
    console.log('Server is running at port 8080.....');
})