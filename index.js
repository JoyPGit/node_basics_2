
//importing the module for use
const express = require('express');
const fs = require('fs');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//const morgan = require('morgan'); 

const appConfig = require('./config/appConfig');

const globalErrorMiddleware = require('./app/middlewares/globalErrorHandler');
const routeLoggerMiddleware = require('./app/middlewares/routeLogger')
const logger = require('./app/libs/loggerLib');

//creating an instance of express   
const app = express();
const http = require('http');

//app.use(morgan(dev));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}));
//app.use(cookieParser());
//app.use(express.static(path.join(_dirname,'client')));

/*app.use is an application level middleware. express.static is used to display static files 
(client side files). these files are found from the path specified. _dirname makes express
look inside the current directory for the file named public*/
/* express.static() is a function that takes a path, and returns a middleware 
that serves all files in that path to /. (If you wanted to prefix it with /public or whatever, 
you'd write app.use('/public', express.static(path.join(__dirname, 'public'))), where 
the first /public is the web path and the second is the filesystem path of the files being served). 
For better clarity, the following:

app.use('/a', express.static(path.join(__dirname, 'b')));
would serve all files inside of the b directory, and have them accessible through http://example.com/a/FILE */

app.use(globalErrorMiddleware.globalErrorHandler);
//app.use(routeLoggerMiddleware.logIp);   


const modelsPath = './app/models';
const controllersPath = './app/controllers';
const libsPath = './app/libs';
const middlewaresPath = './app/middlewares';
const routesPath = './app/routes';

app.all('*', (req,res,next)=>{
    res.header("Access-Control-Allow-Origin",appConfig.allowedCorsOrigin);
    res.header("Access-Control-Allow-Methods","POST,GET,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept");
    next();
})

fs.readdirSync(modelsPath).forEach(function(file) {
    if(~file.indexOf('.js')){
        require(modelsPath +'/' + file);
        console.log(file);
    }
});  

//bootstrap route using routes folder
fs.readdirSync(routesPath).forEach(function(file) {
    if(~file.indexOf('.js')){
        let route = require(routesPath + '/' + file);
        route.setRouter(app);//setRouter is passed an instance of express
    }
}); //routing ends

//if none of the routes match, then only we call the error handler middlewares

//calling global error handler
app.use(globalErrorMiddleware.globalNotFoundHandler);


//db created
let db = mongoose.connect(appConfig.db.uri,{useNewUrlParser : true})//('mongodb://localhost:27017')

mongoose.connection.on('error',function(err){
    console.log("database connection error");
    console.log(err);
});

mongoose.connection.on('open',(err)=>{
    if (err){
        console.log("database connection error");
        console.log(err);
    }
    else{
        console.log("db conn success written at index.js line 86");
    }
});


const server = http.createServer(app);
//start listening to http server
console.log(appConfig);
server.listen(appConfig.port);//appConfig.port


//socket io connection handler
const socketLib = require('./app/libs/socketLib');
const socketServer = socketLib.setServer(server);  //the server created above is passed as param

//end socketio connection handler


/*
app.listen(appConfig.port, function(){
    console.log(`Chat app listening on port ${appConfig.port}`);
    //creating mongodb connection
});*/
/*2 ways of creating servers 
https://stackoverflow.com/questions/17696801/express-js-app-listen-vs-server-listen*/

//////////////////callbacks used////////////////////
server.on('error',onError);
server.on('listening',onListening);

function onError(error){
    if(error.syscall !== 'listen'){
        logger.error(error.code + 'not equal listen', 'server on error handler', 10);
        console.log('the error code is : ' +error.code);
        throw error;
    }

    switch (error.code){
        case 'EACCES':
        logger.error(error.code + ':elevated privileges required', 'serverOnErrorHandler',10)
        process.exit(1);
        break;

        case 'EADDRINUSE':
        logger.error(error.code + ':port already in use', 'serverOnErrorHandler',10)
        process.exit(1);
        break;

        default : 
        logger.error(error.code + ':some unknown error occured', 'serverOnErrorHandler',10);
        throw error;
    }
}

//event listener for server listening event

function onListening(){
    var addr = server.address();
    var bind = typeof addr === 'string'
    ?'pipe' + addr
    :'port' + addr.port;
    ('Listening on' + bind);
    logger.info('server listening on port' + addr.port, 'serverOnListeningHandler',10);
    ///imp note the options in mongoose
    let db = mongoose.connect(appConfig.db.uri,{useNewUrlParser:true});//{ useMongoClient:true},
}

process.on('unhandledRejection',(reason,p)=>{
    console.log('Unhandled rejection at promise ', p ,'reason', reason );
});

mongoose.connection.on('error',function(err){
    console.log('database connection error');
    console.log(error);
    logger.error(err,'mongoose connection on error handler',10)
})

mongoose.connection.on('open',function(err){
    if (err){
    console.log('database connection error');
    console.log(error);
    logger.error(err,'mongoose connection on error handler',10)
    } else {
    console.log("database connection open inside mongoose.connection @index.js 169");
    logger.info("database connection open", 'database connection open handler', 10)    
    }
})


module.exports = app;