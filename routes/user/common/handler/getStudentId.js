var utils = require('../../../../utils');
var getStudentId = {};

getStudentId.studentId = function(req, res, next){
    
    if(req.session.profile){
        let checkPage = req.originalUrl;
        let checkIndex = checkPage.indexOf("/", 1);

        // start from 1 to find the second /
        checkPage = checkPage.substring(1, checkIndex);

        // get students or assistants
        if(checkPage === "students"){

           res.locals.studentId = utils.getPersonId(JSON.parse(req.session.profile));
            if (res.locals.studentId[0] == 'E') {
                res.locals.studentId = '0416004';
            }
        }
        else if(checkPage === "assistants"){
            res.locals.professional_field = req.query.professional_field;
                
            res.locals.studentId = req.query.student_id;
        }

		if(process.env.__ENV__ == 'DEV'){
			const fs = require('fs');
			let setting = fs.readFileSync(__dirname +'/../../../../setting.json');
			try{
				setting = JSON.parse(setting);
			} catch(e) {
				console.log(e);
				setting = {
					student_id: 'undefined',
					teacher_id: 'undefined'
				};
			}
			if(setting.student_id != 'undefined') res.locals.studentId = setting.student_id;
		}

        //res.locals.studentId = '';
		req.csca.student_id = res.locals.studentId;

        next();
    }
    else
        res.redirect('/');
}

getStudentId.studentId_post = function(req, res, next) {
    if (req.session.profile) {
        res.locals.studentId = req.body.student_id;
        next();
    } else {
        res.redirect('/');
    }
}

exports.getStudentId = getStudentId;
