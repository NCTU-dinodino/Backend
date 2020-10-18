var query = require('../../../../db/msql');
var utils = require('../../../../utils');
var table = {};
var nodemailer = require('nodemailer');
var mail_info = require('../../../auth/nctu/mail_info');

table.curriculumAllCourses = function(req, res, next){
    if(req.session.profile){
        
        var teacherId = res.locals.teacherId;  
        query.ShowTeacherCosAll(teacherId, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                for(let i = 0; i<result.length; i++){
                    let year = result[i].unique_id.substring(0,3);
                    let sem = result[i].unique_id.substring(4,5);
                    let id  = result[i].unique_id.substring(6,10);
                    if(sem == 1)
                        result[i].unique_id = year + '上(' + id+ ')';
                    else if(sem == 2)
                        result[i].unique_id = year + '下(' + id+ ')';
                    else
                        result[i].unique_id = year + '暑期(' + id+ ')';       
                }
                req.allCourses = result;
                if(req.allCourses)
                    next();
                else
                    return;
            }
        });
    }
    else
        res.redirect('/');

}

table.curriculumScoreInterval = function(req, res, next){
    if(req.session.profile){ 
        var cos_code = req.body.cos_code;
        var unique_id = req.body.unique_id;  
        var year = unique_id.substring(0,3);
        var sem = unique_id.substring(3,4);
        var id = unique_id.substring(5,9);

        if(sem == '上')
            unique_id = year + '-1-' + id;
        else if(sem == '下')
            unique_id = year + '-2-' + id;
        else
            unique_id = year + '-3-' + id;

        query.ShowCosScoreInterval(cos_code, unique_id, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.scoreInterval = result;
                if(req.scoreInterval)
                    next();
                else
                    return;
            }
        });
   }
    else
        res.redirect('/');
}

table.curriculumScoreDetail = function(req, res, next){
    if(req.session.profile){ 
        var cos_code = req.body.cos_code;
        var unique_id = req.body.unique_id;  
        var year = unique_id.substring(0,3);
        var sem = unique_id.substring(3,4);
        var id = unique_id.substring(5,9);  
        if(sem == '上')
            unique_id = year + '-1-' + id;
        else if(sem == '下')
            unique_id = year + '-2-' + id;
        else
            unique_id = year + '-3-' + id;

        query.ShowCosScoreDetail(cos_code, unique_id, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                req.scoreDetail = result;
                if(req.scoreDetail)
                    next();
                else
                    return;
            }
        });
   }
    else
        res.redirect('/');
}

table.offsetApplySetAgree = function(req, res, next){
    if(req.session.profile){
        var teacherId = utils.getPersonId(JSON.parse(req.session.profile));
		var teacher_email = '';
        query.ShowUserInfo(teacherId, function(err,result){
            if(err){
                throw err;
                return;
            }
            if(!result){
                return;
            }
            result = JSON.parse(result);
	    	teacher_email = result[0].email;
        });

        var state_check = [];
		var mails = [];
        for(var i = 0; i < req.body.courses.length; i++){
            var data = {
                timestamp: req.body.courses[i].timestamp,
                student_id: req.body.courses[i].sid,
                state: req.body.status, 
                reject_reason: req.body.courses[i].reason,                    
                transferto:""
            }
            query.SetOffsetApplyFormAgreeStatus(data, function(err,result){
                if(err){
                    throw err;
                    res.redirect('/');
                }
                if(!result)
                    res.redirect('/');
                else{
                    result = JSON.parse(result);
                    state_check.push(result);                   
                }
            });
           	query.ShowUserInfo(req.body.courses[i].sid, function(err,result){
                if(err){
                    throw err;
                    return;
                }
                if(!result){
                    return;
                }
                result = JSON.parse(result);
                mails.push(result[0].email);
            });    
        }
        setTimeout(function(){
			var mailString='';
            var nameString='';
            for(var j = 0; j< mails.length; j++){
                mailString = mailString + mails[j] + ',';
                //nameString = nameString + info.participants[j] + ',';
            }
            var transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: mail_info.auth
            });
            
            var options = {
                //寄件者
                from: 'nctucsca@gmail.com',
                //收件者
                to: mailString, 
                //副本
                cc: /*req.body.sender_email*/'',
                //密件副本
                bcc: '',
                //主旨
                subject: '', // Subject line
                //純文字
                /*text: 'Hello world2',*/ // plaintext body
                //嵌入 html 的內文
                html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：'+teacher_email+'，謝謝。</p><br/><p>請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                //附件檔案
                /*attachments: [ {
                    filename: 'text01.txt',
                    content: '聯候家上去工的調她者壓工，我笑它外有現，血有到同，民由快的重觀在保導然安作但。護見中城備長結現給都看面家銷先然非會生東一無中；內他的下來最書的從人聲觀說的用去生我，生節他活古視心放十壓心急我我們朋吃，毒素一要溫市歷很爾的房用聽調就層樹院少了紀苦客查標地主務所轉，職計急印形。團著先參那害沒造下至算活現興質美是為使！色社影；得良灣......克卻人過朋天點招？不族落過空出著樣家男，去細大如心發有出離問歡馬找事'
                }]*/
            };
            
            if(req.body.status == 2){
                options.subject = '[交大資工線上助理]同意抵免申請郵件通知';
            }
            else if(req.body.status == 4){
                options.subject = '[交大資工線上助理]不同意抵免申請郵件通知';
            }
            
            if(req.body.status == 2 || req.body.status == 4){
                transporter.sendMail(options, function(error, info){
                    if(error){
                        console.log(error);
                    }
                });
            }

            req.setAgree = {signal : JSON.parse(state_check[0].info.affectedRows)};               
            if(req.setAgree)
                next();
            else
                return;    
        },800);
    }
    else
        res.redirect('/');
}


table.offsetApplyFormList = function(req, res, next){
    if(req.session.profile){
        var teacherId = res.locals.teacherId;    
        var data1 = {student_id: '0516003'};
        var data2 = {all_student: true};
        query.ShowUserOffsetApplyForm(data2, function(err,result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                var group = [];
                for(var i = 0; i < result.length; i++){
                    var one = {
                        "year" : result[i].apply_year,
                        "semester" : parseInt(result[i].apply_semester),
                        "sid": result[i].student_id,
                        "name": result[i].sname,
                        "phone": result[i].phone,
                        "nameA": result[i].cos_cname_old,
                        "codeA": result[i].cos_code_old,
                        "department": result[i].cos_dep_old, 
                        "teacher": result[i].cos_tname_old,
                        "creditA": parseInt(result[i].credit_old),
                        "nameB": result[i].cos_cname,
                        "codeB": result[i].cos_code,
                        "creditB": parseInt(result[i].credit),
                        "typeB": result[i].cos_type,
                        "type": parseInt(result[i].offset_type),
                        "score": result[i].score_old,
                        "reason": result[i].reason,
                        "reason_type": result[i].reason_type,
                        "reject_reason": result[i].reject_reason,
                        "status": parseInt(result[i].agree),
                        "previous": result[i].previous == "0" ? false : true,
                        "date": result[i].timestamp,
                        "file": result[i].file,
                        "transferTo": ""
                        };

                    if(one.type == 0){
                        one.nameA = result[i].cos_cname;
                        one.codeA = result[i].cos_code;
                        one.creditA = parseInt(result[i].credit);
                        one.nameB = result[i].cos_cname_old;
                        one.codeB = result[i].cos_code_old;
                        one.creditB = parseInt(result[i].credit_old);
                    }
                    if(result[i].transferto != null){
                        one.transferTo = result[i].transferto;
                        if(one.transferTo == teacherId){
                            group.push(one);
                        }
                    }
                }
                setTimeout(function(){
                    req.formList = group;              
                    if(req.formList)
                        next();
                    else
                        return; 
                },1000);
            }
        });                           
    }
    else
        res.redirect('/');
}

table.researchSetScore = function(req, res, next){
    if(req.session.profile){
        var content = {
            student_id: '',
            tname: '',
            research_title: '',
            first_second: 0,
            semester: '',
            new_score: 0,
            new_comment: ''
        }
        var info = req.body;
        query.ShowStudentFirstSecond(info.student_id,function(err,result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');

            result = JSON.parse(result);
            var fir_sec = parseInt(result[0].first_second);
            content.student_id = info.student_id;
            content.tname = info.tname;
            content.research_title = info.research_title;
            content.first_second = fir_sec;
            content.semester = info.year;
            content.new_score = parseInt(info.new_score);
            content.new_comment = info.comment;
        });
    
        setTimeout(function(){
            /*query.SetResearchScoreComment(content, function(err,result){
                if(err) throw err;
                var signal = { signal: 1 };
                req.setScore = signal;
                if(req.setScore)
                    next();
                else
                    return;
                res.send(result);
            });*/
            query.SetResearchScoreComment(content);
            req.setScore = {signal: content};           
                if(req.setScore)
                    next();
                else
                    return;
        },800);
    }
    else
        res.redirect('/');
}

table.researchSetTitle = function(req, res, next){
    if(req.session.profile){
        var info = req.body;
        var content = {research_title : info.research_title, tname : info.tname, first_second : info.first_second, semester:info.year, new_title : info.new_title};
        
        query.SetResearchTitle(content);
        setTimeout(function(){
            req.setTitle = {signal: 1};           
            if(req.setTitle)
                next();
            else
                return;
        },800);
    }
    else
        res.redirect('/');

}

table.researchList = function(req, res, next){
    if (req.session.profile) {

        var info = req.body;
        var teacher_id = info.teacherId;
        var sem = info.sem; 
        var group_list = [];
        
        var tname = "";
        var data = {teacher_id: teacher_id}
        query.ShowGradeTeacherResearchStudent(teacher_id,'', function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            
            result = JSON.parse(result);  
            if(result.length == 0){
                var projects = {  
                    groups:[]
                }
            }
            else{
                var index = [];
                var temp = result[0].research_title;
                var projects = {
                    cs_number:0, //*
                    other_number:0, //*
                    current_accept:0,
                    groups: []
                }
                
                var count = 0;
    
                for(var i = 0; i<result.length; i++){
                    if(index[result[i].unique_id] == null){
                        if(result[i].semester != sem) continue;
                        var project = {
                                research_title: '',
                                participants : [],
                                year:'',
                                first_second: '',
                                }
                        project.year = result[i].semester;
                        project.research_title = result[i].research_title;
                        project.first_second = result[i].first_second;
                        projects.groups.push(project);
                        index[result[i].unique_id] = count;
                        count++;
                    }  
                }
                var cs_number = 0, other_number = 0, cnt = 0;
                for(var i = 0; i<result.length; i++){
                    if(result[i].semester != sem) continue;
                    var student = {
                        student_id: '',
                        sname: '',
                        detail: '',
                        comment: '',
                        //replace_pro:0,
                        score: null,
                        student_status: 0
                    }
                    student.student_id = result[i].student_id;
                    student.score = parseInt(result[i].score);
                    student.sname = result[i].sname;
                    student.detail = result[i].class_detail;
                    student.comment = result[i].comment;
                    //student.replace_pro = parseInt(result[i].replace_pro);
                    student.student_status = parseInt(result[i].status);
                    var id = index[result[i].unique_id];
                    projects.groups[id].participants.push(student);
                    
                    query.ShowStudentResearchInfo(student.student_id, function(error, res){
                        if(error){
                            throw error;
                            res.redirect('/');
                        }
                        if(!res){
                            res.redirect('/');
                        }
                        res = JSON.parse(res);
                        if(res[0].status == "1"){
                            cs_number++;
                        }
                        else{
                            other_number++;
                        }
                    });
                }       
                setTimeout(function(){
                   projects.cs_number = cs_number;
                   projects.other_number = other_number;
                   var group_len = projects.groups.length;
                   query.ShowTeacherInfoResearchCnt(data, function(err, result) {
                        if (err){
                            throw err;
                            res.redirect('/');
                        }
                        if(!result){
                            res.redirect('/');
                        }
                        else {
                            result = JSON.parse(result);
                            tname = result[0].tname;
                            
                            var grade = sem.substring(0,3);
                            for(var j = 0; j < result[0].gradeCnt.length; j++){
                                if ( result[0].gradeCnt[j].grade == grade){
                                     projects.current_accept = result[0].gradeCnt[j].scount;
                                     break;
                                }
                            }
                            for (let i = 0; i < group_len; i++) {
                                var group = {
                                    research_title: projects.groups[i].research_title,
                                    participants: projects.groups[i].participants,
                                    year: projects.groups[i].year,
                                    first_second: projects.groups[i].first_second
                                };
                                group_list.push(group);
                            }
                            if(group_list.length === group_len){
                                projects.groups = group_list;
                                req.list = projects;
                                if(req.list)
                                    next();
                                else
                                    return;
                            }
                        }
                    });

                },1000);
            }
        });            
    } 
    else{
        res.redirect('/');
    }
}

table.researchSetReplace = function(req, res, next) {
    let promiseShowUserInfo = (studentId) => new Promise((resolve, reject) => {
        query.ShowUserInfo(studentId, (error, result) => {
            if (error) reject('Cannot fetch ShowUserInfo. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowUserInfo.');
            else resolve(JSON.parse(result)[0]);
        });
    });

    let promiseShowStudentResearchInfo = (studentId) => new Promise((resolve, reject) => {
        query.ShowStudentResearchInfo(studentId, (error, result) => {
            if (error) reject('Cannot fetch ShowStudentResearchInfo. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowStudentResearchInfo.');
            else resolve(JSON.parse(result));
        });
    });

    let promiseShowStudentResearchApplyForm = (studentId) => new Promise((resolve, reject) => {
        query.ShowStudentResearchApplyForm(studentId, (error, result) => {
            if (error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
            else resolve(JSON.parse(result));
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
        query.ShowTeacherResearchApplyFormList(teacherId, '', (error, result) => {
            if (error) reject('Cannot fetch ShowTeacherResearchApplyFormList. Error message: ' + error);
            if (!result) reject('Cannot fetch ShowTeacherResearchApplyFormList.');
            else resolve(JSON.parse(result));
        });
    });

    let promiseDeleteResearch = (studentId, firstSecond, semester) => new Promise((resolve, reject) => {
        let info = {
            student_id: studentId,
            first_second: firstSecond,
            semester: semester
        };
        query.DeleteResearch(info, (error, result) => {
            if (error) reject('Cannot fetch DeleteResearch. Error message: ' + error);
            resolve();
        });
    });

    let promiseSetResearchReplace = (studentId, firstSecond, semester) => new Promise((resolve, reject) => {
        let deleteInfo = {
            student_id: studentId,
            first_second: firstSecond,
            semester: semester
        };
        query.SetResearchReplace(deleteInfo, (error, result) => {
            if (error) reject('Cannot fetch SetResearchReplace. Error message: ' + error);
            resolve();
        });
    });

    let promiseDeleteResearchApplyForm = (semester, unique_id) => new Promise((resolve, reject) => {
        let info = {
            semester: semester,
            unique_id: unique_id
        };

        query.DeleteResearchApplyForm(info, (error, result) => {
            if (error) reject('Cannot fetch DeleteResearchApplyForm. Error message: ' + error);
            resolve();
        });
    });

    let promiseGetStudentsInSameApplyForm = (studentId, semester) => promiseShowStudentResearchApplyForm(studentId)
        .then(applyFormList => applyFormList.find(applyForm => applyForm.semester == semester))
        .then(applyForm => Promise.all([
            Promise.resolve(applyForm.tname),
            promiseShowTeacherIdList(),
            Promise.resolve(applyForm.student_id)
        ]))
        .then(([tname, teacherIdList, studentId]) => [teacherIdList.find(teacher => teacher.tname == tname).teacher_id, teacherIdList.find(teacher => teacher.tname == tname).email, tname, studentId])
        .then(([teacherId, teacherEmail, tname, studentId]) => Promise.all([
            promiseShowTeacherResearchApplyFormList(teacherId),
            Promise.resolve(teacherEmail),
            Promise.resolve(tname),
            Promise.resolve(studentId)
        ]))
        .then(([applyFormList, teacherEmail, tname, studentId]) => {
            var unique_id = applyFormList.find(applyForm => applyForm.student_id == studentId).unique_id;
            return {
                title: title,
                teacher_email: teacherEmail,
                tname: tname,
                student_id: applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.student_id),
                student_email: applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.email),
                unique_id: unique_id
            };
        });

    promiseShowUserInfo(req.body.student_id)
        .then(result => result.email)
        .then(email => {
            if (req.body.agree_replace == 0)
                return promiseGetStudentsInSameApplyForm(req.body.student_id, req.body.semester)
                    .then(result => Promise.all([
                        ...result.student_id.map(studentId => promiseSetResearchReplace(studentId, 0)),
                        promiseDeleteResearchApplyForm(req.body.semester, result.unique_id)
                    ]))
                    .then(_ => [false, email]);
            else if (req.body.agree_replace == 1)
                return promiseSetResearchReplace(req.body.student_id, 0)
                    .then(_ => promiseGetStudentsInSameApplyForm(req.body.student_id, req.body.semester))
                    .then(result => Promise.all([
                        Promise.all(result.student_id.map(studentId => promiseShowStudentResearchInfo(studentId))),
                        Promise.resolve(result.student_email),
                        Promise.resolve(result.teacher_email),
                        promiseDeleteResearch(req.body.student_id, req.body.first_second, req.body.semester)
                    ]))
                    .then(([studentResearchInfos, studentEmails, teacherEmail, _]) => {
                        if (studentResearchInfos.every(researchInfo => researchInfo.every(info => info.replace_pro == '0'))) {
                            let emails = studentEmails.join();
                            let transporter = nodemailer.createTransport({
                                service: 'Gmail',
                                auth: mail_info.auth
                            });

                            let options = {
                                from: 'nctucsca@gmail.com',
                                to: (process.env.__ENV__ == 'DEV' ? '' : teacherEmail),
                                cc: emails,
                                bcc: '',
                                subject: '[交大資工線上助理]專題申請郵件通知',
                                html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：' + teacherEmail + ',學生：' + emails + '謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                            };

                            transporter.sendMail(options, (error, result) => {
                                if (error) return Promise.reject('Cannot send email. Error message: ' + error);
                            });
                        }
                    })
                    .then(_ => [true, email]);
        })
        .then(([status, email]) => {
            let transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: mail_info.auth
            });

            let options = {
                from: 'nctucsca@gmail.com',
                to: email,
                cc: '',
                bcc: '',
                subject: '[交大資工線上助理]專題申請狀態改變通知', // Subject line
                html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡您的老師，謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
            };

            if (status) {
                options.subject = '[交大資工線上助理]同意教授更換申請郵件通知';
            } else {
                options.subject = '[交大資工線上助理]不同意教授更換申請郵件通知';
            }

            transporter.sendMail(options, (error, info) => {
                if (error) return Promise.reject(error);
            });
        })
        .then(_ => {
            res.status(203);
            next();
        })
        .catch(error => {
            console.log(error);
            res.status(403);
            next();
        });

/*table.researchSetReplace = function(req, res, next) {
	let promiseShowUserInfo = (studentId) => new Promise((resolve, reject) => {
		query.ShowUserInfo(studentId, (error, result) => {
			if(error) reject('Cannot fetch ShowUserInfo. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowUserInfo.');
			else resolve(JSON.parse(result)[0]);
		});
	});

	let promiseShowStudentResearchInfo = (studentId) => new Promise((resolve, reject) => {
		query.ShowStudentResearchInfo(studentId, (error, result) => {
			if(error) reject('Cannot fetch ShowStudentResearchInfo. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowStudentResearchInfo.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseShowStudentResearchApplyForm = (studentId) => new Promise((resolve, reject) => {
		query.ShowStudentResearchApplyForm(studentId, (error, result) => {
			if(error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseShowTeacherIdList = () => new Promise((resolve, reject) => {
		query.ShowTeacherIdList((error, result) => {
			if(error) reject('Cannot fetch ShowTeacherIdList. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowTeacherIdList.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseShowTeacherResearchApplyFormList = (teacherId) => new Promise((resolve, reject) => {
		query.ShowTeacherResearchApplyFormList(teacherId, '', (error, result) => {
			if(error) reject('Cannot fetch ShowTeacherResearchApplyFormList. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowTeacherResearchApplyFormList.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseDeleteResearch = (studentId, firstSecond, semester) => new Promise((resolve, reject) => {
		let info = {
			student_id:		studentId,
			first_second:	firstSecond,
			semester:		semester
		};
		query.DeleteResearch(info, (error, result) => {
			if(error) reject('Cannot fetch DeleteResearch. Error message: ' + error);
			resolve();
		});
	});

	let promiseSetResearchReplace = (studentId, firstSecond, semester) => new Promise((resolve, reject) => {
		let deleteInfo = {
			student_id: 	studentId,
			first_second:	firstSecond,
			semester: 		semester
		};
		query.SetResearchReplace(deleteInfo, (error, result) => {
			if(error) reject('Cannot fetch SetResearchReplace. Error message: ' + error);
			resolve();
		});
	});

	let promiseDeleteResearchApplyForm = (title, tname, firstSecond, semester) => new Promise((resolve, reject) => {
		let info = {
			research_title:	title,
			tname:			tname,
			first_second:	firstSecond,
			semester:		semester
		};

		query.DeleteResearchApplyForm(info, (error, result) => {
			if(error) reject('Cannot fetch DeleteResearchApplyForm. Error message: ' + error);
			resolve();
		});
	});

	let promiseGetStudentsInSameApplyForm = (studentId, semester) => promiseShowStudentResearchApplyForm(studentId)
		.then(applyFormList => applyFormList.find(applyForm => applyForm.semester == semester))
		.then(applyForm => Promise.all([
			Promise.resolve(applyForm.tname),
			promiseShowTeacherIdList(),
            Promise.resolve(applyForm.student_id)
		]))
		.then(([tname, teacherIdList, studentId]) => [teacherIdList.find(teacher => teacher.tname == tname).teacher_id, teacherIdList.find(teacher => teacher.tname == tname).email, tname, studentId])
		.then(([teacherId, teacherEmail, tname, studentId]) => Promise.all([
			promiseShowTeacherResearchApplyFormList(teacherId),
			Promise.resolve(teacherEmail),
			Promise.resolve(tname),
            Promise.resolve(studentId)
		]))
		.then(([applyFormList, teacherEmail, tname, studentId]) => {
            var unique_id = applyFormList.find(applyForm => applyForm.student_id == studentId).unique_id;
			return {
				title:			title,
				teacher_email:	teacherEmail,
				tname:			tname,
				student_id:		applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.student_id),
				student_email:	applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.email)
			};
		});

	promiseShowUserInfo(req.body.student_id)
	.then(result => result.email)
	.then(email => {
		if(req.body.agree_replace == 0)
			return promiseGetStudentsInSameApplyForm(req.body.student_id, req.body.semester)
				.then(result => Promise.all([
					...result.student_id.map(studentId => promiseSetResearchReplace(studentId, 0)),
					promiseDeleteResearchApplyForm(result.title, result.tname, req.body.first_second, req.body.semester)
				]))
				.then(_ => [false, email]);
		else if(req.body.agree_replace == 1)
			return promiseSetResearchReplace(req.body.student_id, 0)
				.then(_ => promiseGetStudentsInSameApplyForm(req.body.student_id, req.body.semester))
				.then(result => Promise.all([
					Promise.all(result.student_id.map(studentId => promiseShowStudentResearchInfo(studentId))),
					Promise.resolve(result.student_email),
					Promise.resolve(result.teacher_email),
					promiseDeleteResearch(req.body.student_id, req.body.first_second, req.body.semester)
				]))
				.then(([studentResearchInfos, studentEmails, teacherEmail, _]) => {
					if(studentResearchInfos.every(researchInfo => researchInfo.every(info => info.replace_pro == '0'))) {
						let emails = studentEmails.join();
						let transporter = nodemailer.createTransport({
							service:	'Gmail',
							auth:		mail_info.auth
						});

						let options = {
							from:		'nctucsca@gmail.com',
							to:			(process.env.__ENV__ == 'DEV' ? '' : teacherEmail),
							cc:			emails,
							bcc:		'',
							subject:	'[交大資工線上助理]專題申請郵件通知',
							html:		'<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：' + teacherEmail + ',學生：' + emails + '謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
						};

						transporter.sendMail(options, (error, result) => {
							if(error) return Promise.reject('Cannot send email. Error message: ' + error);
						});
					}
				})
				.then(_ => [true, email]);
	})
	.then(([status, email]) => {
		let transporter = nodemailer.createTransport({
			service: 'Gmail',
			auth: mail_info.auth
		});

		let options = {
			from:		'nctucsca@gmail.com',
			to:			email,
			cc:			'',
			bcc:		'',
			subject:	'[交大資工線上助理]專題申請狀態改變通知', // Subject line
			html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡您的老師，謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
		};

		if(status){
			options.subject = '[交大資工線上助理]同意教授更換申請郵件通知';
		}else{
			options.subject = '[交大資工線上助理]不同意教授更換申請郵件通知';
		}

		transporter.sendMail(options, (error, info) => {
			if (error) return Promise.reject(error);
		});
	})
	.then(_ => {
		res.status(203);
		next();
	})
	.catch(error => {
		console.log(error);
		res.status(403);
		next();
	});*/


    /*if (req.session.profile) {
        var info = req.body;
        var set_content = { student_id: info.student_id, research_title: info.research_title, semester: info.semester, replace_pro: 0 };
        var del_content = { student_id: info.student_id, first_second: info.first_second, semester: info.semester };
        var student_email = '';
        query.ShowUserInfo(info.student_id, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            } else {
                result = JSON.parse(result);
                student_email = result[0].email;
            }
        });
		setTimeout(function() {
			var transporter = nodemailer.createTransport({
    			service: 'Gmail',
    			auth: mail_info.auth
			});
			var options = {
    			from:		'nctucsca@gmail.com',
    			to:			student_email ,
    			cc:			'',
    			bcc:		'',
    			subject:	'[交大資工線上助理]專題申請狀態改變通知', // Subject line
    			html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡您的老師，謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
			};
        	if (info.agree_replace) {
            	query.DeleteResearch(del_content, function(err, result) {
                	if (err) {
                    	throw err;
                    	res.redirect('/');
                	}
					options.subject = '[交大資工線上助理]同意教授更換申請郵件通知';
					transporter.sendMail(options, function(err, info) {
    					if (err)
        					console.log(err);
					});
                	result = JSON.parse(result);
                	req.reply = result;
                	if (req.reply)
                    	next();
                	else
                    	return;
            	});
        	} else {
            	query.SetResearchReplace(set_content, function(err, result) {
                	if (err) {
                    	throw err;
                    	res.redirect('/');
                	}
					options.subject = '[交大資工線上助理]不同意教授更換申請郵件通知';
					transporter.sendMail(options, function(err, info) {
    					if (err)
        					console.log(err);
					});
                	result = JSON.parse(result);
                	req.reply = result;
                	if (req.reply)
                    	next();
                	else
                    	return;
            	});
        	}
		}, 800);
    } else {
        res.redirect('/');
    }*/
}

table.researchChangeTeacherList = function(req, res, next){
	let promiseShowGradeTeacherResearchStudent = (teacherId) => new Promise((resolve, reject) => {
		query.ShowGradeTeacherResearchStudent(teacherId, '', (error, result) => {
			if(error) reject('Cannot fetch ShowGradeTeacherResearchStudent. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowGradeTeacherResearchStudent.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseShowResearchGroupByUniqueID = (uid) => new Promise((resolve, reject) => {
		query.ShowResearchGroupByUniqueID({unique_id: uid}, (error, result) => {
			if(error) reject('Cannot fetch ShowResearchGroupByUniqueID. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowResearchGroupByUniqueID.');
			else resolve(JSON.parse(result));			
		});
	});

	let promiseGetGroup = (studentInfo) => {
		return promiseShowResearchGroupByUniqueID(studentInfo.unique_id)
		.then(groupMembers => {
			return {
				sname:			studentInfo.sname,
				student_id:		studentInfo.student_id,
				email:			studentInfo.email,
				phone:			studentInfo.phone,
				replace_pro:	studentInfo.replace_pro,
				research_title:	studentInfo.research_title,
				year:			studentInfo.semester,
				first_second:	studentInfo.first_second,
				participants:	groupMembers
			};
		});
	};

	let changeTeacherList = [];

	promiseShowGradeTeacherResearchStudent(req.body.teacherId)
	.then(result => result.filter(r => r.semester == req.body.sem))
	.then(students => Promise.all(students.map(student => promiseGetGroup(student))))
	.then(records => {
		records.forEach(record => {
			let groupOfStudent = changeTeacherList.find(group => group.participants.some(participants => participants.student_id == record.student_id));
			
			if(!groupOfStudent){
				groupOfStudent = {
					research_title:	record.research_title,
					year:			record.year,
					first_second:	record.first_second,
					participants:	record.participants
				};
				changeTeacherList.push(groupOfStudent);
			}

			let studentData = groupOfStudent.participants.find(participant => participant.student_id == record.student_id);
			
			Object.assign(studentData, {
				sname:			record.sname,
				email:			record.email,
				phone:			record.phone,
				replace_pro:	parseInt(record.replace_pro)
			});
		});
	})
	.then(_ => {
		changeTeacherList = changeTeacherList.filter(e => e.participants.some(participant => participant.replace_pro == 1));
		req.changeTeacherList = changeTeacherList;
		next();
	})
	.catch(error => {
		console.log(error);
		res.redirect('/');
	});

/*
    if (req.session.profile) {

        var info = req.body;
        var teacher_id = info.teacherId;
        var sem = info.sem;

        query.ShowGradeTeacherResearchStudent(teacher_id,'', function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');

            result = JSON.parse(result);

            if(result.length != 0){
                var index = [];
                var temp = result[0].research_title;
                var count = 0;
                var groups = [];
                var replace_index = [];
				var replace_groups = [];

                for(var i = 0; i<result.length; i++){
                    if(index[result[i].research_title] == null){
                        if(result[i].semester != sem) continue;
                        var project = {
                            research_title: '',
                            participants : [],
                            year:'',
                            first_second: '',
                        }
                        project.year = result[i].semester;
                        project.research_title = result[i].research_title;
                        project.first_second = result[i].first_second;
                        groups.push(project);
                        index[result[i].unique_id] = count;
                        replace_index[count] = 0;
                        count++;
                    }
                }
                for(var i = 0; i<result.length; i++){
                    if(result[i].semester != sem) continue;
                    var student = {
                        student_id: '',
                        sname: '',
                        phone: '',
                        email: '',
                        replace_pro:0
                    }
                    student.student_id = result[i].student_id;
                    student.sname = result[i].sname;
                    student.phone = result[i].phone;
                    student.email = result[i].email;
                    student.replace_pro = parseInt(result[i].replace_pro);
                    var id = index[result[i].unique_id];
                    if(student.replace_pro == 1) replace_index[id] = 1;
                    groups[id].participants.push(student);
                }
                for(var i = 0; i < groups.length; i++){
					if(replace_index[i] == 1)
						replace_groups.push(groups[i]);
				}
                setTimeout(function(){
                    req.changeTeacherList = replace_groups;
                    if(req.changeTeacherList)
                        next();
                    else
                        return;
                },1000);
            }
        });
    }
    else{
        res.redirect('/');
    }
*/
}

table.researchApplySetAgree = function(req, res, next) {
    if (req.session.profile) {
        var info = req.body;
        if (info.agree == '1') {
            let data = {
                student_id: info.student.map(student => student.student_id),
                tname: info.tname,
                research_title: info.research_title,
                first_second: info.first_second,
                semester: info.year
            };
            query.CreateNewGroupResearch(data, (error) => {
                if (error) {
                    throw error;
                    res.redirect('/');
                }
            });

            let promiseShowStudentResearchApplyForm = (studentId) => new Promise((resolve, reject) => {
                query.ShowStudentResearchApplyForm(studentId, (error, result) => {
                    if (error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
                    if (!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
                    else resolve(JSON.parse(result)[0]);
                });
            });

            let promiseDeleteResearchApplyForm = (formInfo) => new Promise((resolve, reject) => {
                query.DeleteResearchApplyForm(formInfo, (error, result) => {
                    if (error) reject('Cannot fetch DeleteResearchApplyForm. Error message: ' + error);
                    if (!result) reject('Cannot fetch DeleteResearchApplyForm.');
                    else resolve();
                });
            });

            promiseShowStudentResearchApplyForm(info.student[0].student_id)
                .then((applyForm) => {
                    return Promise.resolve(applyForm.unique_id);
                })
                .then((unique_id) => {
                    var formInfo = { semester: info.year, unique_id: unique_id };
                    return promiseDeleteResearchApplyForm(formInfo);
                })
                .then(() => {
                    var mailString = '';
                    var nameString = '';
                    for (var j = 0; j < info.student.length; j++) {
                        mailString = mailString + info.student[j].mail + ',';
                        nameString = nameString + info.student[j].student_id + ',';
                    }
                    var transporter = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: mail_info.auth
                    });

                    var options = {
                        //寄件者
                        from: 'nctucsca@gmail.com',
                        //收件者
                        to: mailString,
                        //副本
                        cc: '',
                        //密件副本
                        bcc: '',
                        //主旨
                        subject: '[交大資工線上助理]專題申請狀態改變通知', // Subject line

                        html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡您的老師跟同學,謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                        //附件檔案

                    };
                    
                    transporter.sendMail(options, function(error, info) {
                        if (error) {
                            return Promise.reject('Error sending emails.');
                        }
                    });
                    req.setAgree = { signal: 1 };
                    next();
                })
                .catch((error) => {
                    console.log(error);
                    req.setAgree = { signal: 0 };
                    next();
                });

        } else {
            let promiseShowStudentResearchApplyForm = (studentId) => new Promise((resolve, reject) => {
                query.ShowStudentResearchApplyForm(studentId, (error, result) => {
                    if (error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
                    if (!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
                    else resolve(JSON.parse(result)[0]);
                });
            });

			let promiseSetResearchApplyFormStatus(semester, uid, agree) => new Promise((resolve, reject) => {
				query.SetResearchApplyFormStatus({semester: semester, unique_id: uid, agree: agree}, (error, result) => {
					if (error) reject('Cannot fetch SetResearchApplyFormStatus. Error message: ' + error);
					if (!result) reject('Cannot fetch SetResearchApplyFormStatus.');
					else resolve();
				});
			});

            var formInfo = { research_title: info.research_title, tname: info.tname, first_second: info.first_second, agree: info.agree, semester: info.year };
            promiseShowStudentResearchApplyForm(info.student_id)
			.then(applyForm => promiseSetResearchApplyFormStatus(applyForm.semester, applyForm.unique_id, info.agree))
			.catch((error) => {
				console.log(err);
			});

            setTimeout(function() {
                var mailString = '';
                var nameString = '';
                for (var j = 0; j < info.student.length; j++) {
                    mailString = mailString + info.student[j].mail + ',';
                    nameString = nameString + info.student[j].student_id + ',';
                }
                var transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: mail_info.auth
                });

                var options = {
                    //寄件者
                    from: 'nctucsca@gmail.com',
                    //收件者
                    to: mailString /*'joying62757@gmail.com'*/ ,
                    //副本
                    cc: /*req.body.sender_email*/ '',
                    //密件副本
                    bcc: '',
                    //主旨
                    subject: '[交大資工線上助理]專題申請狀態改變通知', // Subject line
                    //純文字
                    /*text: 'Hello world2',*/ // plaintext body
                    //嵌入 html 的內文
                    html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請直接聯絡 老師：' + ',學生：' + mailString + '謝謝。</p><br/><p>申請狀態已變更, 請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                    //附件檔案
                    /*attachments: [ {
                        filename: 'text01.txt',
                        content: '聯候家上去工的調她者壓工，我笑它外有現，血有到同，民由快的重觀在保導然安作但。護見中城備長結現給都看面家銷先然非會生東一無中；內他的下來最書的從人聲觀說的用去生我，生節他活古視心放十壓心急我我們朋吃，毒素一要溫市歷很爾的房用聽調就層樹院少了紀苦客查標地主務所轉，職計急印形。團著先參那害沒造下至算活現興質美是為使！色社影；得良灣......克卻人過朋天點招？不族落過空出著樣家男，去細大如心發有出離問歡馬找事'
                    }]*/
                };

                transporter.sendMail(options, function(error, info) {
                    if (error) {
                        console.log(error);
                    }
                });
                req.setAgree = { signal: 1 };
                if (req.setAgree)
                    next();
                else
                    return;
            }, 800);
        }
    } else
        res.redirect('/');
}

table.researchApplyList = function(req, res, next){
	let promiseShowStudentResearchInfo = (studentId) => new Promise((resolve, reject) => {
		query.ShowStudentResearchInfo(studentId, (error, result) => {
			if(error) reject('Cannot fetch ShowStudentResearchInfo. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowStudentResearchInfo.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseShowTeacherResearchApplyFormList = (teacherId) => new Promise((resolve, reject) => {
		query.ShowTeacherResearchApplyFormList(teacherId, (error, result) => {
			if(error) reject('Cannot fetch ShowTeacherResearchApplyForm. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowTeacherResearchApplyForm.');
			else resolve(JSON.parse(result));
		});
	});

	promiseShowTeacherResearchApplyFormList(req.body.id)
	.then(applyFormList => {
		let projects = {};

		applyFormList.forEach(applyForm => {
			if(applyForm.agree == '3') return;
			if(!projects[applyForm.unique_id]){
				let project = {
					research_title:	applyForm.research_title,
					status: 		applyForm.agree,
					year: 			applyForm.semester,
					first_second: 	applyForm.first_second,
					participants: 	[]
				};
				projects[applyForm.unique_id] = project;
			}
			let student = {
				student_id:		applyForm.student_id,
				sname:			applyForm.sname,
				email:			applyForm.email,
				phone:			applyForm.phone,
				first_second:	applyForm.first_second,
				student_status:	applyForm.status,
				replace_pro:	applyForm.replace_pro,
                CPEStatus:		applyForm.CPEStatus
			};
			projects[applyForm.unique_id].participants.push(student);
		});

		projects = Object.values(projects);
		return projects;
	})
	.then(projects => {
		projects = projects.filter(project => {
            if(project.participants.some(student => student.CPEStatus == '0' || student.CPEStatus == '2')) return false;
			if(project.first_second == '1') return true;
			if(project.participants.some(student => student.replace_pro == '1')) return false;
			return true;
		});
		req.list = projects;
		next();
	})
	.catch(error => {
		console.log(error);
		res.redirect('/');
	});

	/*if(req.session.profile){
		var teacher_id = res.locals.teacherId;
		query.ShowTeacherResearchApplyFormList(teacher_id, (err, result) => {
			if(err){
				throw err;
				res.redirect('/');
			}
			if(!result)
				res.redirect('/');
			var apply_forms = JSON.parse(result);
			var projects = [];
			apply_forms.forEach((apply_form) => {
				if(apply_form.agree == '3')
					return;
				if(!projects[apply_form.research_title]){
					let project = {
						research_title:	apply_form.research_title,
						first_second:	apply_form.first_second,
						year:		apply_form.semester,
						status:		apply_form.agree,
						participants:	[]
					};
					projects[project.research_title] = project;
				}
				let student = {
					student_id:apply_form.student_id,
					sname:apply_form.sname,
					email:apply_form.email,
					phone:apply_form.phone,
					first_second:apply_form.first_second,
					student_status:apply_form.status
				};
				projects[apply_form.research_title].participants.push(student);
			});
			req.list = Object.keys(projects).map((key) => {
				return projects[key];
			});
			next();
		});
	}else
		res.redirect('/');*/
}

table.adviseeSemesterGradeList = function(req, res, next){
    if(req.session.profile){
        var input = req.body.student_id;                
        query.ShowSemesterScore(input, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                result = JSON.parse(result);
                var list = [];
                for(var i = 0; i < result.length; i++){
                    var grade = {
                        semester: result[i].semester,
                        failed: result[i].failed == 'false' ? false : true,
                        avg : parseInt(result[i].avg),
                        credit: parseInt(result[i].credit),
                        score: []
                    };
                    for(var j = 0; j < result[i].score.length; j++){
                        var scoreObj = {
                            cn: result[i].score[j].cn,
                            en: result[i].score[j].en,
                            score: (parseInt(result[i].score[j].score)> 0) ? parseInt(result[i].score[j].score) : null,
                            pass: result[i].score[j].pass == '通過' ? true :( (result[i].score[j].pass == 'W') ? 'W' : false)
                        }
                        grade.score.push(scoreObj);
                    }
                    if(grade.score.length == result[i].score.length)
                        list.push(grade);
                }
                if(list.length == result.length){
                    req.semesterGradeList = list;       
                    if(req.semesterGradeList)
                        next();
                    else
                        return;
                }
            }
        });
    }
    else
        res.redirect('/');
}
table.adviseeList = function(req, res, next){
    if(req.session.profile){
        var teacherId = res.locals.teacherId;
        query.ShowTeacherMentors(teacherId, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
                var info = [];
                result = JSON.parse(result);
                
                for(var i=0;i<result.length;i++){
                    query.ShowUserInfo(result[i].student_id, function(err,profile){
                        if(err){
                            throw err;
                            return;
                        }
                        if(!profile){
                            return;
                        }
                        else{
                            profile = JSON.parse(profile);
                            profile ={
                                student_id: profile[0].student_id,
                                sname: profile[0].sname,
                                program: profile[0].program,
                                graduate: profile[0].graduate,
                                graduate_submit: profile[0].graduate_submit,
                                email: profile[0].email,
                                recent_failed:(profile[0].recent_failed =="true")?true:false,
                                failed:(profile[0].failed =="failed")?true:false
                            }
                            info.push(profile);
                        }
                        if(info.length == result.length){
                            req.list = info;       
                            if(req.list)
                                next();
                            else
                                return;
                        }
                    });
    
                }
            }
        });
    }
    else
        res.redirect('/');
}
table.adviseePersonalInfo = function(req, res, next){
    if(req.session.profile){
        query.ShowUserInfo(req.body.student_id, function(err,profile){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!profile){
                res.redirect('/');
            }
            else{
                profile = JSON.parse(profile);
                profile ={
                    sname: profile[0].sname,
                    program: profile[0].program,
                    graduate: profile[0].graduate,
                    graduate_submit: profile[0].graduate_submit,
                    email: profile[0].email
                }
                req.personalInfo = profile;       
                if(req.personalInfo)
                    next();
                else
                    return;
            }
                
        });
        
    }
    else
        res.redirect('/');
}
exports.table = table;
