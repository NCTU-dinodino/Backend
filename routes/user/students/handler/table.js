var query = require('../../../../db/msql');
var table = {};
var fs = require('fs');
var nodemailer = require('nodemailer');
var mail_info = require('../../../auth/nctu/mail_info');

/*列出該名學生的抵免列表*/
table.offsetApplyList = function(req, res, next){
    if(req.session.profile){
         var StudentId = res.locals.studentId;
         var data = {student_id: StudentId};
         query.ShowUserOffsetApplyForm(data, function(err,result){
             if(err){
                 throw err;
                 res.redirect('/');
             }
             if(!result)
                 res.redirect('/');
             else{
                 result = JSON.parse(result);
                 var list = {
                     waive_course: [],
                     exempt_course: [],
                     compulsory_course: [],
                     english_course: []
                 };
                 for(var i = 0; i < result.length; i++){
                     //轉校轉系抵免
                     var agree_status = parseInt(result[i].agree) ;
                     if(agree_status == 1 || agree_status == 5 )
                         agree_status = 0;
                     else if (agree_status == 2)
                         agree_status = 1;
                     else if (agree_status == 3 ||agree_status == 4)
                         agree_status = 2;
                     else if (agree_status == 6)
                         agree_status = 3;

                     if(result[i].offset_type === "2"){
                         var waive = {
                             "timestamp": result[i].timestamp,
                             "phone": result[i].phone,
                             "original_school": result[i].school_old,
                             "original_department": result[i].dep_old,
                             "current_school": "交通大學",
                             "current_department": "資工系",
                             "original_graduation_credit": parseInt(result[i].graduation_credit_old),
                             "apply_year": parseInt(result[i].apply_year),
                             "apply_semester": parseInt(result[i].apply_semester),
                             "original_course_year": parseInt(result[i].cos_year_old),
                             "original_course_semester": parseInt(result[i].cos_semester_old),
                             "original_course_name": result[i].cos_cname_old,
                             "original_course_department": result[i].cos_dep_old,
                             "original_course_credit": parseInt(result[i].credit_old),
                             "original_course_score": result[i].score_old,
                             "current_course_code": result[i].cos_code,
                             "current_course_name": result[i].cos_cname,
                             "current_course_credit": parseInt(result[i].credit),
                             "current_course_type": result[i].cos_type,
                             "file": result[i].file,
                             "status": agree_status,
                             "reject_reason": result[i].reject_reason
                         
                         };
                         list.waive_course.push(waive);
                     }
                     //英授抵免
                     else if(result[i].offset_type === "1"){
                         var english = {
                             "timestamp": result[i].timestamp,
                             "apply_year" : parseInt(result[i].apply_year),
                             "apply_semester" : parseInt(result[i].apply_semester),
                             "phone": result[i].phone,
                             "reason": result[i].reason,
                             "department": result[i].cos_dep_old, 
                             "teacher": result[i].cos_tname_old,
                             "credit": parseInt(result[i].credit),
                             "course_code": result[i].cos_code_old,
                             "course_name": result[i].cos_cname_old,
                             "file": result[i].file,
                             "status": agree_status,
                             "reject_reason": result[i].reject_reason
                         };
                         list.english_course.push(english);
                     }
                     //外系抵免
                     else if(result[i].offset_type === "0"){
                         var compulsory = {
                             "timestamp": result[i].timestamp,
                             "apply_year" : parseInt(result[i].apply_year),
                             "apply_semester" : parseInt(result[i].apply_semester),
                             "phone": result[i].phone,
                             "reason": { "type" :result[i].reason_type,
                                         "content": result[i].reason
                                         },
                             "department": result[i].cos_dep_old, 
                             "teacher": result[i].cos_tname_old,
                             "credit": parseInt(result[i].credit),
                             "course_year":parseInt(result[i].cos_year_old),
                             "course_semester":parseInt(result[i].cos_semester_old),
                             "course_code": result[i].cos_code,
                             "course_name": result[i].cos_cname,
                             "original_course_code": result[i].cos_code_old,
                             "original_course_name": result[i].cos_cname_old,
                             "original_course_credit": parseInt(result[i].credit_old),
                             "file": result[i].file,
                             "status": agree_status,
                             "reject_reason": result[i].reject_reason
                         };
                         list.compulsory_course.push(compulsory);
                     }
                      else if(result[i].offset_type === "3"){
                         var exempt = {
                             "timestamp": result[i].timestamp,
                             "phone": result[i].phone,
                             "apply_year" : parseInt(result[i].apply_year),
                             "apply_semester" : parseInt(result[i].apply_semester),
                             "original_course_year": parseInt(result[i].cos_year_old),
                             "original_course_semester": parseInt(result[i].cos_semester_old),
                             "original_course_name": result[i].cos_cname_old,
                             "original_course_department": result[i].cos_dep_old,
                             "original_course_credit": parseInt(result[i].credit_old),
                             "original_course_score": result[i].score_old,
                             "current_course_code": result[i].cos_code,
                             "current_course_name": result[i].cos_cname,
                             "current_course_credit": parseInt(result[i].credit),
                             "file": result[i].file,
                             "current_course_type": result[i].cos_type,
                             "status": agree_status,
                             "reject_reason": result[i].reject_reason

                         };
                         list.exempt_course.push(exempt);
                     }

                 }
             }
             req.list = list;       
             if(req.list)
                 next();
             else
                 return;
         });
     }
     else
        res.redirect('/');

}

/*提交抵免單：本系必修課程抵免*/
table.offsetCreateCompulsory = function(req, res, next){
    if(req.session.profile){
            var StudentId = res.locals.studentId;
            var data = {
              student_id: StudentId,
              phone: req.body.phone,
              apply_year: req.body.apply_year,
              apply_semester: req.body.apply_semester,
              cos_dep_old: req.body.department,
              cos_tname_old: req.body.teacher,
              cos_cname_old: req.body.original_course_name,
              cos_code_old: req.body.original_course_code,
              cos_cname: req.body.course_name,
              cos_code: req.body.course_code,
              cos_type: null,
              credit: req.body.credit,
              reason: req.body.reason.content,
              credit_old: req.body.original_course_credit,
              file: req.body.file,
              school_old: null,
              dep_old: null,
              graduation_credit_old: null ,
              cos_year_old: req.body.course_year,
              cos_semester_old: req.body.course_semester,
              score_old: null ,
              offset_type: 0,
              reason_type:req.body.reason.type
            };
            query.CreateOffsetApplyForm(data, function(err,result){
                if(err){
                    throw err;
                    res.redirect('/');
                }
                if(!result)
                    res.redirect('/');
                else{
                    result = JSON.parse(result);    
                    req.createCompulsory = result;       
                    if(req.createCompulsory)
                        next();
                    else
                        return;
                }
            });                           
        }
        else
            res.redirect('/');
}

/*提交抵免單：英授專業課程抵免*/
table.offsetCreateEnglish = function(req, res, next){
    if(req.session.profile){
            var StudentId = res.locals.studentId;
            var data = {
              student_id: StudentId,
              phone: req.body.phone,
              apply_year: req.body.apply_year,
              apply_semester: req.body.apply_semester,
              cos_dep_old: req.body.department,
              cos_tname_old: req.body.teacher,
              cos_cname_old: req.body.course_name,
              cos_code_old: req.body.course_code,
              cos_cname: null,
              cos_code: null,
              cos_type: null,
              credit: req.body.credit,
              reason: req.body.reason,
              credit_old: 0,
              file: req.body.file,
              school_old: '',
              dep_old: '',
              graduation_credit_old: 0,
              cos_year_old: 0,
              cos_semester_old: 0,
              score_old: 0,
              offset_type: 1,
              reason_type: null

            };
            query.CreateOffsetApplyForm(data, function(err,result){
                if(err){
                    throw err;
                    res.redirect('/');
                }
                if(!result)
                    res.redirect('/');
                else{
                    result = JSON.parse(result);
                    req.createEnglish = result;       
                    if(req.createEnglish)
                        next();
                    else
                        return;
                }
            });                           
        }
        else
            res.redirect('/');
            

}

/*提交抵免單：學分抵免*/
table.offsetCreateExempt = function(req, res, next){
    if (req.session.profile) {
        var student_id = res.locals.studentId;
        var data = {
            student_id: student_id,
            phone: req.body.phone,
            apply_year: req.body.apply_year,
            apply_semester: req.body.apply_semester,
            cos_dep_old: req.body.original_course_department,
            cos_tname_old: null,
            cos_cname_old: req.body.original_course_name,
            cos_code_old: null,
            cos_cname: req.body.current_course_name,
            cos_code: req.body.current_course_code,
            cos_type: req.body.current_course_type,
            credit: req.body.current_course_credit,
            reason: null,
            credit_old: parseInt(req.body.original_course_credit),
            file: req.body.file,
            school_old: null,
            dep_old: null,
            graduation_credit_old: null,
            cos_year_old: req.body.original_course_year,
            cos_semester_old: req.body.original_course_semester,
            score_old: req.body.original_course_score,
            offset_type: 3,
            reason_type: null
        };

        query.CreateOffsetApplyForm(data, function(err, result) {
            if(err)
                throw err;
                res.redirect('/');
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.createExempt = result;       
                if(req.createExempt)
                    next();
                else
                    return;
            }
        });
    } 
    else
        res.redirect('/');

}

/*提交抵免單：課程免修*/
table.offsetCreateWaive = function(req, res, next){
if (req.session.profile) {
        var student_id = res.locals.studentId;
        
        var data = {
            student_id: student_id,
            phone: req.body.phone,
            apply_year: req.body.apply_year,
            apply_semester: req.body.apply_semester,
            cos_dep_old: req.body.original_course_department,
            cos_tname_old: null,
            cos_cname_old: req.body.original_course_name,
            cos_code_old: null,
            cos_cname: req.body.current_course_name,
            cos_code: req.body.current_course_code,
            cos_type: req.body.current_course_type,
            credit: parseInt(req.body.current_course_credit),
            reason: null,
            credit_old: parseInt(req.body.original_course_credit),
            file: req.body.file,
            school_old: req.body.original_school,
            dep_old: req.body.original_department,
            graduation_credit_old: parseInt(req.body.original_graduation_credit),
            cos_year_old: parseInt(req.body.original_course_year),
            cos_semester_old: parseInt(req.body.original_course_semester),
            score_old: req.body.original_course_score,
            offset_type: 2,
            reason_type: null
        };
        query.CreateOffsetApplyForm(data, function(err, result) {
            if(err)
                throw err;
                res.redirect('/');
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.createWaive = result;       
                if(req.createWaive)
                    next();
                else
                    return;
            }
        });
    } 
    else
        res.redirect('/');

}

/*更新抵免單*/
table.offsetApplyEdit = function(req, res, next){
    if (req.session.profile) {
        var student_id = res.locals.studentId;
         
        if(req.body.credit_type == 1){ // 學分抵免
            var data = { 
                student_id: student_id,
                phone: req.body.phone,
                apply_year: req.body.apply_year,
                apply_semester: req.body.apply_semester,
                cos_dep_old: req.body.original_course_department,
                cos_tname_old: null,
                cos_cname_old: req.body.original_course_name,
                cos_code_old:  null,
                cos_cname: req.body.current_course_name,
                cos_code: req.body.current_course_code,
                cos_type: req.body.current_course_type,
                credit: req.body.current_course_credit,
                reason: null,
                credit_old: req.body.original_course_credit,
                file: req.body.file,
                school_old: req.body.original_school,           
                dep_old: req.body.original_department,              
                graduation_credit_old: req.body.original_graduation_credit,
                cos_year_old: req.body.original_course_year,         
                cos_semester_old: req.body.original_course_semester,     
                score_old: req.body.original_course_score,
                reason_type: null,
                state: 0,
                timestamp: req.body.timestamp,
                resend: 1
            }
        }
        else if (req.body.credit_type == 2){ // 課程免修
             var data = { 
                student_id: student_id,
                phone: req.body.phone,
                apply_year: req.body.apply_year,
                apply_semester: req.body.apply_semester,
                cos_dep_old: req.body.original_course_department,
                cos_tname_old: null,
                cos_cname_old: req.body.original_course_name,
                cos_code_old:  null,
                cos_cname: req.body.current_course_name,
                cos_code: req.body.current_course_code,
                cos_type: req.body.current_course_type,
                credit: req.body.current_course_credit,
                reason: null,
                credit_old: req.body.original_course_credit,
                file: req.body.file,
                school_old: null,           
                dep_old: null,              
                graduation_credit_old: null,
                cos_year_old: req.body.original_course_year,         
                cos_semester_old: req.body.original_course_semester,     
                score_old: req.body.original_course_score,
                reason_type: null,
                state :0,
                timestamp: req.body.timestamp,
                resend: 1
            }
        }
        else if (req.body.credit_type == 3){ // 必修抵免
             var data = { 
                student_id: student_id,
                phone: req.body.phone,
                apply_year: req.body.apply_year,
                apply_semester: req.body.apply_semester,
                cos_dep_old: req.body.department,
                cos_tname_old: req.body.teacher,
                cos_cname_old: req.body.original_course_name,
                cos_code_old:  req.body.original_course_code,
                cos_cname: req.body.course_name,
                cos_code: req.body.course_code,
                cos_type: null,
                credit: req.body.credit,
                reason: req.body.reason.content,
                credit_old: req.body.original_course_credit,
                file: req.body.file,
                school_old: null,           
                dep_old: null,              
                graduation_credit_old: null,
                cos_year_old: req.body.course_year,         
                cos_semester_old: req.body.course_semester,     
                score_old: null,
                reason_type: req.body.reason.type,
                state: 0,
                timestamp: req.body.timestamp,
                resend: 1
            }

        }
        else if (req.body.credit_type == 4){ // 英授抵免
             var data = { 
                student_id: student_id,
                phone: req.body.phone,
                apply_year: req.body.apply_year,
                apply_semester: req.body.apply_semester,
                cos_dep_old: req.body.department,
                cos_tname_old: req.body.teacher,
                cos_cname_old: req.body.course_name,
                cos_code_old:  req.body.course_code,
                cos_cname: null,
                cos_code: null,
                cos_type: null,
                credit: req.body.credit,
                reason: req.body.reason,
                credit_old: null,
                file: req.body.file,
                school_old: null,           
                dep_old: null,              
                graduation_credit_old: null,
                cos_year_old: null,         
                cos_semester_old: null,     
                score_old: null,
                reason_type: null,
                state: 0,
                timestamp: req.body.timestamp,
                resend: 1
            }
        }
         query.ModifyOffsetApplyForm(data, function(err, result) {
            if(err)
                throw err;
                res.redirect('/');
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.edit = result;       
                if(req.edit)
                    next();
                else
                    return;
            }
        });
    } else {
        res.redirect('/');
    }
}

/*刪除抵免單*/
table.offsetApplyDelete = function(req, res, next){
    if (req.session.profile) {
        var student_id = res.locals.studentId;
        var data = {
            timestamp: req.body.timestamp,
            student_id: student_id
        }
        query.DeleteOffsetApplyForm(data, function(err, result) {
            if(err)
                throw err;
                res.redirect('/');
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.delete = result;       
                if(req.delete)
                    next();
                else
                    return;
            }
        });
    } 
    else 
        res.redirect('/');

}

/*列出推薦選課列表*/
table.recommendCourseList = function(req, res, next){
    if(req.session.profile){
        var studentId = res.locals.studentId;
        query.ShowRecommendCos(studentId, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
             }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.courseList = result;       
               if(req.courseList)
                    next();
                else
                    return;
            }
        });
    }
    else 
        res.redirect('/');

}

/*給推薦選課評分*/
table.recommendSetStar = function(req, res, next){
    if (req.session.profile) {
        var star = {
        student_id: req.body.student_id, 
        unique_id: req.body.unique_id,
        star_level: Number(req.body.star_level) };
        query.SetRecommendCosStar(star, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            } 
            else if (!result) {
                res.redirect('/');
            } 
            else {
                result = JSON.parse(result);
                req.setStar = result;       
                if(req.setStar)
                    next();
                else
                    return;
            }
        });
    }
    else 
        res.redirect('/');

}

/*列出熱門選課列表*/
table.recommendCurrent = function(req, res, next){
    if(req.session.profile){
        var studentId = {student_id: res.locals.studentId};
        query.ShowStudentHotCos(studentId, function(err, result){
            if(err){
                throw err;
                return;
            }
            if(!result)
                res.redirect('/');
            else{
                var result = JSON.parse(result);
                var list = [];
                for (var i = 0; i < result.length; i++) {
                    var hot_course = { 
                            unique_id: '',
                            url: '',
                            cos_credit: '',
                            cos_time: '',
                            depType: '',
                            tname: '',
                            cos_cname: '' };
                    hot_course.unique_id = result[i].unique_id;
                    hot_course.url = result[i].url;
                    hot_course.cos_credit = result[i].cos_credit;
                    hot_course.cos_time = result[i].cos_time;
                    hot_course.depType = result[i].depType;
                    hot_course.tname = result[i].tname;
                    hot_course.cos_cname = result[i].cos_cname;
                    list.push(hot_course);
                }
                req.current = list;       
                if(req.current)
                    next();
                else
                    return;
            }
        });
    }
    else 
        res.redirect('/');

}

/*課程地圖規則*/
table.courseMapRule = function(req, res, next){
    if(req.session.profile){
        var studentId = res.locals.studentId;
        query.ShowCosMapRule(studentId, function(err,result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result){
                res.redirect('/');
            }
            else {
                result = JSON.parse(result);
                req.rule = result;       
                if(req.rule)
                    next();
                else
                    return;
            }
        });
    }
    else
      res.redirect('/');

}

/*課程地圖上通過的課*/
table.courseMapPass = function(req, res, next){
    if(req.session.profile){
        var studentId = res.locals.studentId;
        query.ShowCosMapPass(studentId, function(err,result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result){
                res.redirect('/');
            }
            else {
                result = JSON.parse(result);
                req.pass = result;       
                if(req.pass)
                    next();
                else
                    return;
            }
        });
    }
    else
      res.redirect('/');

}

/*專題列表（包含申請中的專題）*/
table.researchList = function(req, res, next){
	let promiseShowStudentResearchApplyForm = new Promise((resolve, reject) => {
		if(!req.session.profile) reject('Student profile not found.');
		else{
			query.ShowStudentResearchApplyForm(res.locals.studentId, (error, result) => {
				if(error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
				if(!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
				resolve(JSON.parse(result));
			});
		}
	});

	let promiseShowStudentResearchInfo = new Promise((resolve, reject) => {
		if(!req.session.profile) reject('Student profile not found.');
		else{
			query.ShowStudentResearchInfo(res.locals.studentId, (error, result) => {
				if(error) reject('Cannot fetch ShowStudentResearchInfo. Error message: ' + error);
				if(!result) reject('Cannot fetch ShowStudentResearchInfo.');
				resolve(JSON.parse(result));
			});
		}
	});

	Promise.all([promiseShowStudentResearchApplyForm, promiseShowStudentResearchInfo])
	.then(([studentResearchApplyForm, studentResearchInfo]) => {
		let result = [...studentResearchApplyForm, ...studentResearchInfo];
		result = result.map((data) => (
			{
				student_id:		data.student_id,
				tname:			data.tname,
				title:			data.research_title,
				score:			data.score == null ? null : parseInt(data.score),
				semester:		data.semester,
				comment:		data.comment,
				first_second:	data.first_second == null ? null : parseInt(data.first_second),
				department:		data.status == null ? null : parseInt(data.status),
				status:			data.agree == null ? null : parseInt(data.agree),
				add_status:		data.add_status == null ? null : parseInt(data.add_status),
				replace_status:	data.replace_pro == null ? null : parseInt(data.replace_pro)
			}
		));
		req.list = result;
		next();
	}).catch((error) => {
		console.log(error);
		res.redirect('/');
	});
	/*
    if(req.session.profile){
        var studentId = res.locals.studentId;
        query.ShowStudentResearchApplyForm(studentId, function(err, form){
                if(!form)
                    res.redirect('/');
                if(err){
                    throw err;
                    res.redirect('/');
                }
                else{
                    form = JSON.parse(form);
                    query.ShowStudentResearchInfo(studentId, function(err, project){
                        if(!project)
                            res.redirect('/');
                        if(err){
                           throw err;
                            res.redirect('/');
                        }
                        else{
                            project = JSON.parse(project);
                            req.list = [...project,...form].map((record) => (
				{
					student_id: record.student_id,
					tname: record.tname,
					title: record.research_title,
					score: record.score == null ? null : parseInt(record.score),
					semester: record.semester,
					comment: record.comment,
					first_second: parseInt(record.first_second),
					department: parseInt(record.status),
					status: record.agree,
					add_status: record.add_status == null ? null : parseInt(record.add_status),
					replace_status: record.replace_pro == null ? null : parseInt(record.replace_pro)
				}
			    )); 
                            if(req.list)
                                next();
                            else
                                return;
                        }
            
                    });   
                    
                }
            });
    }
    else
        res.redirect('/');
	*/
}

/*回傳該學生填專題表時的狀況（status代表啥看db的github）*/
table.researchShowStudentStatus = function(req, res, next){
    let promiseShowStudentResearchStatus = (studentId) => new Promise((resolve, reject) => {
		if(!req.session.profile) reject('Student profile not found.');
		else{
			query.ShowStudentResearchStatus(studentId, (error, result) => {
				if(error) reject('Cannot fetch ShowStudentResearchStatus. Error message: ' + error);
				if(!result) reject('Cannot fetch ShowStudentResearchStatus.')
				resolve(JSON.parse(result));
			});
		}
	});

	let promiseList = req.body.members.map(student => promiseShowStudentResearchStatus(student.student_id));

	Promise.all(promiseList)
	.then((result) => {
		result = result.map(r => r[0]).map((student, idx) => {
			let status = parseInt(student.status);
			if(status == 1 && req.body.members[idx].first_second == '2') status = 6;
			else if(req.body.members[idx].first_second == '1' && status == 2) status = 5;

			return {
				student_id: student.student_id,
				status:		status
			};
		});
		res.status = result;
		next();
	})
	.catch((error) => {
		console.log(error);
		res.redirect('/');
	});
	/*
	if(req.session.profile){ 
        var group =[];
        for(var i = 0;i< req.body.participants.length; i++){

            query.ShowStudentResearchStatus(req.body.participants[i].student_id, function(err,result){ 
                if(err){
                    throw err;                                                                                              
                    res.redirect('/');
                }
                if(!result)
                    res.redirect('/');      
                else{                                                          
		    query.ShowStudentResearchInfo(req.body.participants[i].student_id, (err, result_2) => {
                    	result = JSON.parse(result);
			result2 = JSON.parse(result_2);
			result.status = (result2.some((record) => (record.first_second == '1'))) ? result.status : '6';
                    	group =[...group, ...result];
		    });
                }
             }); 
        }
        setTimeout(function(){
            req.status = group;       
            if(req.status)
                next();
            else
                return;
        },200);                                        
    }
    else
        res.redirect('/');
	*/
}

/*編輯專題的資訊*/
table.researchEdit = function(req, res, next){
    if(req.session.profile){
        var info = req.body;
        var set_project = {tname: info.tname, research_title : info.research_title, first_second:info.first_second,semester:info.semester,  new_title : info.research_title, new_file: info.new_file, new_photo: info.new_photo, new_filename: info.new_fileName, new_intro:info.new_intro};
	query.SetResearchInfo(set_project, function(err){
            if(err){
               throw err;
               res.redirect('/');
            }
        
        });
        setTimeout(function(){
            req.edit = {signal :1};      
            if(req.edit)
                next();
            else
                return;
        },500);

     }
    else
        res.redirect('/');


}

/*更換專題教授，並寄送信件給教授*/
table.researchSetReplace = function(req, res, next){
    if (req.session.profile) {
        var info = {
            student_id: req.body.student_id,
            research_title: req.body.research_title,
            semester: req.body.semester,
            replace_pro: req.body.replace_pro
        };
		var student_email = '';
		query.ShowUserInfo(req.body.student_id, function(err, result) {
			if (err) {
				throw err;
				res.redirect('/');
			}
			result = JSON.parse(result);
			student_email = result[0].email;
		});
        var tname = req.body.tname;
        query.ShowTeacherIdList(function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            result = JSON.parse(result);
            var teacher_email = '';
            for (var i = 0; i < result.length; i++) {
                if (result[i].tname == tname) {
                    teacher_email = result[i].email;
                }
            }
			var transporter = nodemailer.createTransport({
    			service: 'Gmail',
    			auth: mail_info.auth
			});
			var options = {
    			from: 'nctucsca@gmail.com',
    			to: teacher_email, 
    			cc: '',
    			bcc: '',
    			subject: '[交大資工線上助理]學生申請<更換專題教授>通知', // Subject line
    			html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 學生：' + student_email + ' 謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
			};
            query.SetResearchReplace(info, function(err, result) {
                if (err) {
                    throw err;
                    res.redirect('/');
                } 
                if (!result) {
                    res.redirect('/');
                }
                else {
                    result = JSON.parse(result); 
                    req.setReplace = { signal: result.info.affectedRows };
					transporter.sendMail(options, function(err, info) {
    					if (err)
        					console.log(err);
					});
                    if (req.setReplace)
                        next();
                    else
                        return;
                }
            });
        });
    } 
    else {
        res.redirect('/');
    }

}

/*建立專題申請，並發送信件給學生*/
table.researchApplyCreate = function(req, res, next) {
    let promiseShowTeacherIdList = () => new Promise((resolve, reject) => {
        query.ShowTeacherIdList((error, result) => {
            if (error) reject('Cannot fetch ShowTeacherIdList. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowTeacherIdList.');
            else resolve(JSON.parse(result));
        });
    });

    let promiseShowStudentResearchInfo = (studentId) => new Promise((resolve, reject) => {
        query.ShowStudentResearchInfo(studentId, (error, result) => {
            if (error) reject('Cannot fetch ShowStudentResearchInfo. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowStudentResearchInfo.');
            else resolve(JSON.parse(result));
        });
    });

    let promiseShowStudentResearchStatus = (studentId) => new Promise((resolve, reject) => {
        query.ShowStudentResearchStatus(studentId, (error, result) => {
            if (error) reject('Cannot fetch ShowStudentResearchStatus. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowStudentResearchStatus.');
            else resolve(JSON.parse(result));
        });
    });

    let promiseCreateGroupResearchApplyForm = (input) => new Promise((resolve, reject) => {
        query.CreateGroupResearchApplyForm(input, (error, result) => {
            if (error) reject('Cannot fetch CreateGroupResearchApplyForm. Error message: ' + error);
            if (!result) reject('Cannot fetch CreateGroupResearchApplyForm.');
            else if (result == 'wrong') resolve(result);
            else resolve(JSON.parse(result));
        });
    });

	let promiseSendMail = (options) => new Promise((resolve, reject) => {
			let transporter = nodemailer.createTransport({
				service: 'Gmail',
				auth: mail_info.auth
			});
			transporter.sendMail(options, (error, result) => {
				if (error) reject('Cannot send email. Error message: ' + error);
				resolve();
			});
	});

    let promiseCreate = (students) => {
        let info = students.map(student => {
            let studentInfo = {
                phone: student.phone,
                student_id: student.student_id,
                research_title: req.body.title,
                tname: req.body.tname,
                first_second: student.first_second,
                email: student.email,
                semester: req.body.semester,
                program: student.department,
                name: student.name
            };
            return studentInfo;
        });
        return promiseCreateGroupResearchApplyForm(info);
    };

    let promiseSetResearchReplace = (studentId, replace) => new Promise((resolve, reject) => {
        let info = {
            student_id: studentId,
            replace_pro: replace
        };
        query.SetResearchReplace(info, (error, result) => {
            if (error) reject('Cannot fetch SetResearchReplace. Error message: ' + error);
            resolve();
        });
    });

    let promiseCreateOrSetReplace = (students) => {
        let first_second = students[0].first_second;
        if (first_second == 1) {
            return promiseCreate(students)
                .then(result => {
                    if (result == 'wrong') return Promise.reject('Cannot create research apply form.');
                    else return Promise.resolve();
                });
        } else if (first_second == 2) {
            return Promise.all(students.map((student) => promiseShowStudentResearchStatus(student.student_id)))
                .then(results => {
                    if (results.some(result => result[0].status != 2 && result[0].status != 4))
                        return Promise.reject('One student hasn\'t applied research 1.');
                    else
                        return Promise.all(students.map((student) => promiseSetResearchReplace(student.student_id, 1)))
                })
                .then(_ => promiseCreate(students))
                .then(result => {
                    if (result == 'wrong') return Promise.reject('Cannot create research apply form.');
					else return Promise.resolve();
                    return Promise.all([promiseShowStudentResearchInfo(student.student_id), promiseShowTeacherIdList()]);
                })
                .then(([researchInfo, teacherIdList]) => {
                    let originalTeacherName = researchInfo.find(r => r.first_second == '1').tname;
                    let originalTeacherEmail = teacherIdList.find(r => r.tname == originalTeacherName).email;
                    let emails = students.map(student => student.student_email).join();
                    return Promise.resolve();
                });
        }
    };

	let promiseSendNotificationMail = (students) => {
		let first_second = students[0].first_second;
		if (first_second == 1){
			let address = students.map(student => student.email).join();
			let options = {
				from: 'nctucsca@gmail.com',
				to: (process.env.__ENV__ == 'DEV' ? '' : req.body.teacher_email),
				cc: address,
				bcc: '',
				subject: '[交大資工線上助理]專題申請郵件通知',
				html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：' + req.body.teacher_email + ',學生：' + address + '謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
			};
			return promiseSendMail(options);
		} else if (first_second == 2) {
			return Promise.all([promiseShowTeacherIdList(), ...students.map(student => promiseShowStudentResearchInfo(student.student_id))])
				.then(([teacherIdList, ...researchInfos]) => researchInfos.map(researchInfo => {
					let originalTeacherName = researchInfo.find(r => r.first_second == '1').tname;
					let originalTeacherEmail = teacherIdList.find(r => r.tname == originalTeacherName).email;
					return originalTeacherEmail;
				}))
				.then(teacherEmails => {
					return Promise.all(teacherEmails.map((teacherEmail, idx) => {
						let options = {
							from: 'nctucsca@gmail.com',
							to: (process.env.__ENV__ == 'DEV' ? '' : teacherEmail),
							cc: '',
							bcc: '',
							subject: '[交大資工線上助理]學生申請<更換專題教授、更換組員>通知', // Subject line
							html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 學生：' + students[idx].student_id + ' 謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
						};
						return promiseSendMail(options);
					}));
				});
		}
	};

	promiseSendNotificationMail(req.body.members)
	.then(_ => promiseCreateOrSetReplace(req.body.members))
	.then(_ => {
		res.status(200);
		next();
	})
	.catch(error => {
		console.log(error);
		if(error.startsWith('Cannot send email.')) res.status(400);
		else res.status(403);
		next();
	});

/*	
    let promiseList = (members) => {
        let unique = [];
        members.forEach(student => {
            if (!unique.includes(student.student_id))
                unique.push(student.student_id)
        });
        if (unique.length !== members.length)
            throw new Error('There are duplicate members.');
        else
            return [promiseCreateOrSetReplace(members)];
    }

    Promise.all(promiseList(req.body.members))
        .then(result => {
            if (result.every(r => r.type == 'create')) {
                let emails = result[0].student_emails;

                let options = {
                    from: 'nctucsca@gmail.com',
                    to: (process.env.__ENV__ == 'DEV' ? '' : req.body.teacher_email),
                    cc: emails,
                    bcc: '',
                    subject: '[交大資工線上助理]專題申請郵件通知',
                    html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：' + req.body.teacher_email + ',學生：' + emails + '謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                };

				return promiseSendMail(options);
            } else {
                result.filter(info => info.type == 'replace').forEach(info => {
                    let options = {
                        from: 'nctucsca@gmail.com',
                        to: (process.env.__ENV__ == 'DEV' ? '' : info.teacher_email),
                        cc: '',
                        bcc: '',
                        subject: '[交大資工線上助理]學生申請<更換專題教授、更換組員>通知', // Subject line
                        html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 學生：' + info.student_email + ' 謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                    };

					return promiseSendMail(options);
                });
            }
        })
        .then(mailSendStatus => {
            if(mailSendStatus) res.status(400);
			else res.status(204);
            next();
        })
        .catch((error) => {
            console.log(error);
            res.status(403);
            next();
        });


    /*	promiseShowResearchTitleNumber()
    	.then((result) => {
    		let num = parseInt(result[0].count);
    		let promiseList = [];
    		req.body.members.forEach((student) => {
    			let studentInfo = {
    				phone:			student.phone,
    				student_id:		student.student_id,
    				research_title:	req.body.title + (num != 1 ? '_' + num : ''),
    				tname:			req.body.tname,
    				first_second:	student.first_second,
    				email:			student.email,
    				semester:		req.body.semester,
    				program:		student.department,
    				name:			student.name
    			};
    			promiseList.push(promiseCreateResearchApplyForm(studentInfo));
    		});
    		return Promise.all(promiseList);
    	})
    	.then((result) => {
    		if(result.some((status) => (status == 'wrong'))) res.status(403);
    		else res.status(204);
    	})
    	.then(() => {
    		let mails = req.body.members.reduce((acc, cur) => (acc + cur.email + ','), '');
    		
    		let transporter = nodemailer.createTransport({
    			service:	'Gmail',
    			auth:		mail_info.auth
    		});
    		let options = {
    			from:		'nctucsca@gmail.com',
    			to:			(process.env.__ENV__ == 'DEV' ? '' : req.body.teacher_email),
    			cc:			mails,
    			bcc:		'',
    			subject:	'[交大資工線上助理]專題申請郵件通知]',
    			html:		'<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：' + req.body.teacher_email + ',學生：' + mails + '謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
    		};
    		transporter.sendMail(options, (error, result) => {
    			if(error) console.log(error);
    		});
    		next();
    	})
    	.catch((error) => {
    		console.log(error);
    		res.redirect('/');
    	});
        if (req.session.profile) {
                var info = req.body;
                var data = {
                    tname: info.tname,
                    research_title: info.title,
                    semester: info.semester
                };
                query.ShowResearchTitleNumber(data, function(error, result){
                    if(error){
                        throw error;
                        res.redirect('/');
                    }
                    if(!result)
                        res.redirect('/');
                    var num = JSON.parse(result)[0]['count'];
                    for(var i = 0;i< info.participants.length; i++){
                        var studentInfo = {phone : info.participants[i].phones, student_id : info.participants[i].student_id, research_title : info.title, tname : info.tname,first_second : info.participants[i].first_second, email : info.participants[i].email, semester: info.semester, program : info.participants[i].department, name : info.participants[i].name};
                        if(num != "1")
                            studentInfo.research_title += "_" + num;
                            query.CreateResearchApplyForm(studentInfo, function(err, res1){
                                if(err){
                                    throw err;
                                    res.redirect('/');
                                }
                                if(res1 == 'wrong'){
                                    res.status(403);
                                }
                            });
                    }
            }); 
            
            setTimeout(function(){
                var mailString= '';
                var nameString='';
                for(var j = 0; j< info.email.length; j++){
                    mailString = mailString + info.email[j] + ',';
                    nameString = nameString + info.participants[j] + ',';
                }
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: mail_info.auth
                });
                
                var options = {
                    //寄件者
                    from: 'nctucsca@gmail.com',
                    //收件者
                    to: info.teacher_email, 
                    //副本
                    cc: mailString,
                    //密件副本
                    bcc: '',
                    //主旨
                    subject: '[交大資工線上助理]專題申請郵件通知', // Subject line
                    //純文字
                    html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：'+info.teacher_email + ',學生：' + mailString +'謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                };
                
                transporter.sendMail(options, function(error, info){
                    if(error){
                        console.log(error);
                    }
                });
                
                if(req.create)
    		res.status(204);
                    next();
                else
                    return;
            },1000);
        } 
        else {
            res.redirect('/');
        }
    */
}

/*刪除專題申請*/
table.researchApplyDelete = function(req, res, next) {
    let promiseSetResearchReplace = (studentId, replace) => new Promise((resolve, reject) => {
        let info = {
            student_id: studentId,
            replace_pro: replace
        };
        query.SetResearchReplace(info, (error, result) => {
            if (error) reject('Cannot fetch SetResearchReplace. Error message: ' + error);
            resolve();
        });
    });

    let promiseDeleteResearchApplyForm = (semester, uid) => new Promise((resolve, reject) => {
        let queryData = {
            semester: semester,
			unique_id: uid
        };

        query.DeleteResearchApplyForm(queryData, (error, result) => {
            if (error) reject('Cannot fetch DeleteResearchApplyForm. Error message: ' + error);
            if (!result) reject('Cannot fetch DeleteResearchApplyForm.');
            resolve(result);
        });
    });

    let promiseShowTeacherIdList = () => new Promise((resolve, reject) => {
        query.ShowTeacherIdList((error, result) => {
            if (error) reject('Cannot fetch ShowTeacherIdList. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowTeacherIdList.');
            else resolve(JSON.parse(result));
        });
    });

    let promiseShowTeacherResearchApplyFormList = (teacherId) => new Promise((resolve, reject) => {
        query.ShowTeacherResearchApplyFormList(teacherId, (error, result) => {
            if (error) reject('Cannot fetch ShowTeacherResearchApplyFormList. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowTeacherResearchApplyFormList.');
            else resolve(JSON.parse(result));
        });
    });

	let promiseShowResearchGroupByUniqueID = (uid) => new Promise((resolve, reject) => {
		query.ShowResearchGroupByUniqueID({unique_id: uid}, (error, result) => {
            if (error) reject('Cannot fetch ShowResearchGroupByUniqueID. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowResearchGroupByUniqueID.');
            else resolve(JSON.parse(result));
		});
	});

    promiseShowTeacherIdList()
        .then(result => result.find(r => r.tname == req.body.tname).teacher_id)
        .then(teacherId => promiseShowTeacherResearchApplyFormList(teacherId))
        .then(applyFormList => applyFormList.find(applyForm => applyForm.student_id == req.body.student_id).unique_id)
        //.then(unique_id => applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.student_id))
        //.then(studentIdList => Promise.all(studentIdList.map(studentId => promiseSetResearchReplace(studentId, 0))))
        .then(uid => promiseDeleteResearchApplyForm(req.body.semester, uid))
        .then(_ => {
            res.status(204);
            next();
        })
        .catch(error => {
            console.log(error);
            res.status(403);
        });
}

/*列出教授以前指導過的專題*/
table.professorInfoPastResearch = function(req, res, next){
	let promiseShowGradeTeacherResearchStudent = (teacherId) => new Promise((resolve, reject) => {
		if(!req.session.profile) reject('Student profile not found.');
		else{
			query.ShowGradeTeacherResearchStudent(teacherId, '', (error, result) => {
				if(error) reject('Cannot fetch ShowGradeTeacherResearchStudent. Error message: ' + error);
				if(!result) reject('Cannot fetch ShowGradeTeacherResearchStudent.');
				resolve(JSON.parse(result));
			});
		}
	});

	promiseShowGradeTeacherResearchStudent(req.body.teacher_id)
	.then((result) => (result
		.filter((record) => (record.first_second == '2'))
		.map((record) => ({title: record.research_title, semester: record.semester}))
	))
	.then((result) => {
		let map = {};
		result.forEach((data) => {
			map[data.title + data.semester] = data;
		});
		return Object.values(map).sort();
	})
	.then((result) => {
		req.pastResearch = result;
		next();
	})
	.catch((error) => {
		console.log(error);
		res.redirect('/');
	});

	/*
   if (req.session.profile) {
    var teacherId = req.body.teacher_id;
    var data = {teacher_id: teacherId };
    query.ShowGradeTeacherResearchStudent(teacherId, '', function(err, result) {
      if (err) {
        throw err;
        res.redirect('/');
      }
      if (!result) res.redirect('/');

      result = JSON.parse(result);
      var projects = [];
      var index = [];
      var count = 0;

      for (var i = 0; i < result.length; i++) {
        if (index[result[i].research_title] == null) {
          if (result[i].first_second != '2') continue; //this api only want 專二
          var project = {
            research_title: '',
            semester: '',
            intro: '',
          };
          project.research_title = result[i].research_title;
          project.semester = result[i].semester;
          projects.push(project);
          index[result[i].research_title] = count;
          count++;
        }
      }
      if(count == projects.length){
        req.pastResearch = projects;   
        if(req.pastResearch)
            next();
        else
            return;
      }
    });
  } else {
    res.redirect('/');
  }  
*/
}

/*列出教授列表，及各教授相關資訊*/
table.professorInfoList = function(req, res, next){
    if (req.session.profile) {
        var info;
        var IDlist;
        var data = {teacher_id:''};
        query.ShowTeacherInfoResearchCnt(data ,function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                var grade = req.query.year;
                var info = [];
                var flag;
                for(var i = 0; i < result.length; i++){
                    for(var j = 0; j < result[i].gradeCnt.length; j++){
                        
                        if(result[i].gradeCnt[j].grade == grade){
                            info.push({ tname: result[i].tname,teacher_id: result[i].teacher_id, phone:result[i].phone, email: result[i].email, expertise: result[i].expertise, info : result[i].info, photo : result[i].photo, scount: parseInt(result[i].gradeCnt[j].scount)});
                            flag =1;
                            break;
                        }                       
                        else
                            flag = 0;
                    }
                    if (flag==0)
                        info.push({ tname: result[i].tname,teacher_id:result[i].teacher_id, phone:result[i].phone, email: result[i].email, expertise: result[i].expertise, info : result[i].info, photo : result[i].photo, scount: 0 });
                }
                req.list = info;   
                if(req.list)
                    next();
                else
                    return;
            }
        });
        
    } 
    else {
        res.redirect('/');
    }

}

/*回傳該學生的導師*/
table.professorInfoGetMentor = function(req, res, next){
    if (req.session.profile) {
        var studentId = res.locals.studentId;
        query.ShowStudentMentor(studentId, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.getMentor = result;   
               if(req.getMentor)
                    next();
                else
                    return;
            }
        }); 
    } 
    else {
        res.redirect('/');
    }

}

table.professorInfoScount = (req, res, next) => {
	let promiseShowTeacherInfoResearchCnt = new Promise((resolve, reject) => {
		query.ShowTeacherInfoResearchCnt({teacher_id: ''}, (error, result) => {
			if(error) reject('Cannot fetch ShowTeacherInfoResearchCnt. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowTeacherInfoResearchCnt.');
			else resolve(JSON.parse(result));
		});
	});

	promiseShowTeacherInfoResearchCnt
	.then(result => result.map(r => {
		let scount = r.gradeCnt.find(record => record.grade == req.query.year);
		scount = (scount == null ? 0 : parseInt(scount.scount));
		return {
			teacher_id:	r.teacher_id,
			scount:		scount
		};
	}))
	.then(result => {
		req.scount = result;
		next();
	})
	.catch(error => {
		console.log(error);
		res.redirect('/');
	});
}

exports.table = table;
