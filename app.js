var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
//var logger = require('morgan');
//var cookieParser = require('cookie-parser');         /* disable cookieParser since we don't need it right now */
var bodyParser = require('body-parser');
var yaml = require('js-yaml');
var routes = require('./routes/index');
var Engine = require('./engine/engine').Engine;
var winston = require('winston');
var fs = require('fs');
var js = require("jsonfile");
var utils = require("./utils");
var app = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * allow js to send ajax bid request
 */
app.use(function(req, res, next){
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    next();
});

app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

var rootDir = process.cwd();

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

try {
    var config = yaml.safeLoad(fs.readFileSync(rootDir + "/config/app_config.yaml", 'utf8'));
    var configSchema = js.readFileSync(path.join(rootDir, "config", "config_schema.json"), "utf8");
    app.set('config', utils.validateJSON(configSchema, config));
    app.set('port', config.port);
    winston.level = config.log_level;
} catch (e) {
    winston.log('error', "fail to load configuration, %s", e);
    process.exit(1);
}

try{
    var engine = new Engine(rootDir);
    engine.launch(app.get('config').engine);
}catch (e){
    winston.log('error', "fail to start bid engine, %s", e);
    process.exit(1);
}

/*mongo log*/
var oplog = app.get('config').mongolog;
winston.loggers.add('mongo',{
    console: {
        level: 'silly',
        colorize: true,
        label: 'category one'
    }
});

app.set('engine', engine);

module.exports = app;
