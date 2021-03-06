var path = require('path');
var https = require('https');
var session = require('client-sessions');
var express = require('express');
var app = express();
var utils = require('./utils');
var randoms = require('./randomVals');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var csrfProtection = csrf();
var helmet = require('helmet');
module.exports.init = function(){

  app.use(helmet());
  //app.use(require('./middleware/setSession').setSession);
  app.use(session({
    cookieName: "session",
    secret: randoms.randomVals.sessionKey,
    httpOnly: true,
    secure: true,
    //duration: 1 * 60 * 1000,
    //activeDuration : 5 * 60 * 1000,
    duration: 0,
    activeDuration : 35 * 60 * 1000,
 }));
/*  app.use(function(req, res, next){
      req.session.profile = '{"email":"sophia850413.cs03@nctu.edu.tw","username":"0316201","personStatus":"s"}';
      next();
  });*/
  app.use(csrfProtection);
  app.use(require('./middleware/setCsrf').setCsrf);
  app.use(require('./middleware/setProfile').setProfile);

	//app.use(bodyParser.json());
	app.use(bodyParser.json({limit: '50mb'}));
	app.use(bodyParser.urlencoded({
		limit: '50mb',
		extended: true
	}));


	/*add test route here*/
	if(process.env.__ENV__ == 'DEV'){
  		try{
			app.use(require('./routes/BackendTest/TestPage.js'));
		} catch(e) {
			console.log('Test file ignored.');
		}
	}



	app.use('/', (req, res, next) => {
		if(!req.query.fail && req.profile && (req.profile == 'Not Found' || req.profile[0].status == 'c')) res.redirect('?fail=1');
		else next();	
	});
  
	app.use('/^\/assistants|\/teachers|\/students/', (req, res, next) => {
		if(!req.profile) res.redirect('/');
		else next();
	});

	app.use('/assistants', (req, res, next) => {
		if(JSON.parse(req.session.profile).personStatus != 'a') res.redirect('/');
		else next();
	});

	app.use('/students', (req, res, next) => {
		if(JSON.parse(req.session.profile).personStatus != 'w' && JSON.parse(req.session.profile).personStatus != 's') res.redirect('/');
		else next();
	});

	app.use('/teachers', (req, res, next) => {
		if(JSON.parse(req.session.profile).personStatus != 'p') res.redirect('/');
		else next();
	});


//  app.use('/students/*', require('./middleware/verifyUser').verifyUser, require('./middleware/verifyUser').verifyStudents, require('./middleware/verifyUser').verifyGrade, require('./middleware/verifyUser').verifyProgram);
//  app.use('/assistants/*', require('./middleware/verifyUser').verifyUser, require('./middleware/verifyUser').verifyAssistants);
  app.use('/assistants/*', function(req, res, next){
      res.locals.studentId = req.query.student_id
      next();
  });
  app.use('/students/*', function(req, res, next){
      if(!res.locals.studentId);
        res.locals.studentId = '0316248';
        //res.locals.studentId = utils.getPersonId(JSON.parse(req.session.profile));
      next();
  });
  app.use(express.static('./public'));
  app.use('/', express.static('./public', {index: 'index.html'}));
  app.use('/students/head', express.static('./public', {index: 'index.html'}));
  app.use('/students/grad', express.static('./public', {index: 'index.html'}));
  app.use('/students/map', express.static('./public', {index: 'index.html'}));
  app.use('/students/recommend', express.static('./public', {index: 'index.html'}));
  app.use('/students/professor', express.static('./public', {index: 'index.html'}));
  app.use('/students/project', express.static('./public', {index: 'index.html'}));
  app.use('/teachers/head', express.static('./public', {index: 'index.html'}));
  app.use('/teachers/group', express.static('./public', {index: 'index.html'}));
  app.use('/teachers/course', express.static('./public', {index: 'index.html'}));
  app.use('/teachers/family', express.static('./public', {index: 'index.html'}));
  app.use('/teachers/verify', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/head', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/grad', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/project', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/family', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/family/:tid', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/verify', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/course', express.static('./public', {index: 'index.html'}));
  app.use('/assistants/setting', express.static('./public', {index: 'index.html'}));
app.use('/students/credit', express.static('./public', {index: 'index.html'}));

app.use('/teachers/group', express.static('./public', {index: 'index.html'}));
app.use('/teachers/family', express.static('./public', {index: 'index.html'}));
app.use('/teachers/course', express.static('./public', {index: 'index.html'}));


/*
  app.use('/', express.static('./public', { index: 'index.login.html'}));
  app.use('/students/head', express.static('./public', { index: 'index.student.html'}));
  app.use('/assistants/head', express.static('./public', { index: 'index.assistant.html'}));
*/
 
  app.use('/assistants/head/s/:sid/:sname/:sgroup/:type', express.static('./public', { index: 'index.html'}));
  app.use('/assistants/head/c/:sid/:type/:time/:sname/:grade/:program', express.static('./public', { index: 'index.html'}));

  //app.use('/api/', api());


  //app.use(require('./api/Index.js'));

 
  /*done*/
	app.use((req, res, next) => {req.csca = {'raw_data': {}}; next();});
	app.use(require('./routes/Backend_revise/public/src/router/student.js'));
	app.use(require('./routes/Backend_revise/public/src/router/assistant.js'));

  app.use(require('./routes/logout'));
  app.use(require('./routes/auth/nctu/nctu'));
  app.use(require('./routes/user/students/profile'));
  app.use(require('./routes/user/students/graduate'));
  app.use(require('./routes/user/students/courseMap'));
  app.use(require('./routes/user/students/recommend')); 
  app.use(require('./routes/user/students/offsetApply')); 
  app.use(require('./routes/user/students/research')); 
  app.use(require('./routes/user/students/professorInfo')); 
  app.use(require('./routes/user/professor/profile'));
  app.use(require('./routes/user/professor/curriculum'));
  app.use(require('./routes/user/professor/researchApply'));
  app.use(require('./routes/user/professor/research'));
  app.use(require('./routes/user/professor/advisee'));
  app.use(require('./routes/user/professor/offsetApply'));
  app.use(require('./routes/user/assistants/offsetApply'));
  app.use(require('./routes/user/assistants/research'));
  app.use(require('./routes/user/assistants/graduate'));
  app.use(require('./routes/user/assistants/advisee'));
  app.use(require('./routes/user/assistants/profile'));
  app.use(require('./routes/user/common/bulletin'));
  app.use(require('./routes/user/common/dataUpload'));
  app.use(require('./routes/user/common/other'));
  app.use(require('./routes/user/common/mail'));
  return app;
};
