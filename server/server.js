/**
 * Module with HTML routes and server methods.
 * Created by FantyG on 2017-02-09.
 */
let server = {
    port: 80,
    host: 'localhost',
    database: {
        uri: 'postgres://slrirzkvxaybvn:a5a0dbe8dae17d6c52f1a07b58ee166d2c82d951b7759d811f3e7e14e6d89a3b@ec2-46-137-97-169.eu-west-1.compute.amazonaws.com:5432/dorlm81j0mudi?sslmode=require',
        user: 'slrirzkvxaybvn',
        password: 'a5a0dbe8dae17d6c52f1a07b58ee166d2c82d951b7759d811f3e7e14e6d89a3b',
        type: 'postgres'
    }
};

server.Sequelize = require('sequelize');

server.models = require('./config/models')(server.Sequelize);

server.tables = [];

server.getHomePage = function (req, res) {
    res.sendFile('D:/Coolections/server/home/home.html', null, function () {
        console.log('Home page sended.');
    })
};

server.getUserPage = function (req, res) {
    console.log('Get logged page.');
    console.log('Req: ');
    res.send('GET request to logged page.');
};

server.postUser = function (req, res) {
    if (!server.checkHeader(req)) {
        server.sendJsonRequired(res);
        return;
    }
    const userService = require('./services/userService');
    userService.create(req.body, server.connection, server.tables.user,
        server.tables.unactivatedUser, server, server.response(res));
};

server.activateUser = function (req, res) {
    if (!server.checkHeader(req)) {
        server.sendJsonRequired(res);
        return;
    }
    const userService = require('./services/userService');
    userService.activateUser(req.body, server.tables.unactivatedUser)
        .then(function (result) {
            server.response(res)(result.message, result.headers, result.status);
        }).catch(function (error) {
        console.log(error);
    });
};

server.routes = require('./config/routes')(server);

server.response = function (res) {
    return function (message, headers, status) {
        console.log('status: ' + status);
        console.log('message: ' + message);
        console.log('headers: ' + headers.toString());
        headers = headers || [];
        if (typeof message !== 'string') {
            throw new TypeError('message must be string');
        }
        res.status(status);
        headers.forEach(function (header) {
            res.setHeader(header.name, header.value);
        });
        res.send(message);
    };
};

server.sendJsonRequired = function (res) {
    res.status(400);
    let error = {
        message: 'JSON is required to communicate with server.'
    };
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(error));
};

server.checkHeader = function (req) {
    return req.get('Content-Type') === 'application/json';
};

server.removeUnactivatedUsers = function () {
    const userService = require('./services/userService');
    setTimeout(userService.removeUnactivatedUsers(server.tables.user, server.tables.unactivatedUser), 10000);
};

server.connectionInfo = function () {
    console.log("Server started");
};

server.createModels = function () {
    console.log('Creating models - connection: ' + this.connection);
    this.models.forEach(function (model) {
        if (model.references && model.references.model) {
            model.references.model = server.tables[model.references.model];
        }
        server.tables[model.name] = server.connection.define(model.name, model.columns, {
            freezeTableName: true
        });
    });
    server.connection.sync();
};

server.setRoutes = function (app) {
    this.routes.forEach(function (route) {
        switch (route.method) {
            case 'GET':
                app.get(route.route, route.call);
                break;
            case 'POST':
                //noinspection JSUnresolvedFunction
                app.post(route.route, route.call);
                break;
            case 'PUT':
                //noinspection JSUnresolvedFunction
                app.put(route.route, route.call);
                break;
            case 'DELETE':
                app.delete(route.route, route.call);
                break;
        }
    });
    app.listen(this.port, this.connectionInfo);
};

server.start = function () {
    const express = require('express');
    server.app = express();
    const bodyParser = require('body-parser');
    const mailer = require('express-mailer');
    server.connection = new this.Sequelize(
        this.database.uri,
        {
            host: this.host,
            dialect: this.database.type,
            protocol: this.database.type,
            pool: {
                max: 5,
                min: 0,
                idle: 10000
            },
            dialectOptions: {ssl: true}
        }
    );
    this.createModels();
    server.app.use(bodyParser.json());
    mailer.extend(server.app, {
        from: 'no-replay@coollections.com',
        host: 'smtp.gmail.com',
        secureConnection: true,
        port: 465,
        transportMethod: 'SMTP',
        auth: {user: 'surveynokia2016@gmail.com', pass: 'votefortrump2016'}
    });
    server.app.set('views', __dirname + '\\views');
    server.app.set('view engine', 'pug');
    server.setRoutes(server.app);
    server.removeUnactivatedUsers();
};

module.exports = server;