var query = require('../../../../db/msql');
var utils = require('../../../../utils');
var table = {};
var nodemailer = require('nodemailer');
var mail_info = require('../../../auth/nctu/mail_info');

// offset table----------------------------------------------------------------------

/* 助理改變抵免申請單狀態，並寄信通知 */
table.offsetApplySetAgree = function(req, res, next) {
    if (req.session.profile) {
        var assistant_email = '';
        var teacher_email = '';
        var assistantId = utils.getPersonId(JSON.parse(req.session.profile));
        query.ShowUserInfo(assistantId, function(err, result) {
            if (err) {
                throw err;
                return;
            }
            if (!result) {
                return;
            }
            result = JSON.parse(result);
            assistant_email = result[0].email;
        });
        if (req.body.transferTo) {
            query.ShowUserInfo(req.body.transferTo, function(err, result) {
                if (err) {
                    throw err;
                    return;
                }
                if (!result) {
                    return;
                }
                result = JSON.parse(result);
                teacher_email = result[0].email;
            });
        }

        var state_check = [];
        var mails = [];
        for (var i = 0; i < req.body.courses.length; i++) {
            var data = {
                timestamp: req.body.courses[i].timestamp,
                student_id: req.body.courses[i].sid,
                state: req.body.status,
                // status: 0 申請中，1 等候主管同意，2 同意抵免，3 抵免失敗(助理不同意)，4 抵免失敗(教授不同意)，5 等候老師同意，6 退回等學生修改
                reject_reason: req.body.courses[i].reason,
                transferto: req.body.transferTo
            }
            query.SetOffsetApplyFormAgreeStatus(data, function(err, result) {
                if (err) {
                    throw err;
                    res.redirect('/');
                }
                if (!result)
                    res.redirect('/');
                else {
                    result = JSON.parse(result);
                    state_check.push(result);
                }
            });
            query.ShowUserInfo(req.body.courses[i].sid, function(err, result) {
                if (err) {
                    throw err;
                    return;
                }
                if (!result) {
                    return;
                }
                result = JSON.parse(result);
                mails.push(result[0].email);
            });
        }
        setTimeout(function() {
            var mailString = '';
            var nameString = '';
            for (var j = 0; j < mails.length; j++) {
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
                cc: /*req.body.sender_email*/ '',
                //密件副本
                bcc: '',
                //主旨
                subject: '', // Subject line
                //純文字
                /*text: 'Hello world2',*/ // plaintext body
                //嵌入 html 的內文
                html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
                //附件檔案
                /*attachments: [ {
                    filename: 'text01.txt',
                    content: '聯候家上去工的調她者壓工，我笑它外有現，血有到同，民由快的重觀在保導然安作但。護見中城備長結現給都看面家銷先然非會生東一無中；內他的下來最書的從人聲觀說的用去生我，生節他活古視心放十壓心急我我們朋吃，毒素一要溫市歷很爾的房用聽調就層樹院少了紀苦客查標地主務所轉，職計急印形。團著先參那害沒造下至算活現興質美是為使！色社影；得良灣......克卻人過朋天點招？不族落過空出著樣家男，去細大如心發有出離問歡馬找事'
                }]*/
            };

            if (req.body.status == 2) {
                options.subject = '[交大資工線上助理]同意抵免申請郵件通知';
            } else if (req.body.status == 3) {
                options.subject = '[交大資工線上助理]不同意抵免申請郵件通知';
            } else if (req.body.status == 5) {
                options.to = teacher_email;
                options.subject = '[交大資工線上助理]轉交抵免申請郵件通知';
                options.html = '<p>此信件由系統自動發送，請勿直接回信！抵免申請審核已由助理轉交至老師，等候老師同意。若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
            } else if (req.body.status == 6) {
                options.subject = '[交大資工線上助理]退回抵免申請(等候學生修改)郵件通知';
                options.html = '<p>此信件由系統自動發送，請勿直接回信！退回申請原因請進入系統查看。若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>請進入交大資工線上助理確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p>'
            }

            if (req.body.status == 2 || req.body.status == 3 || req.body.status == 5 || req.body.status == 6) {
                transporter.sendMail(options, function(error, info) {
                    if (error) {
                        console.log(error);
                    }
                });
            }

            var signal = { signal: JSON.parse(state_check[0].info.affectedRows) };
            req.setAgree = signal;
            if (req.setAgree)
                next();
            else
                return;
        }, 1000);

    } else
        res.redirect('/');
}

/* 列出該學生的抵免申請單 */
table.offsetApplyInfo = function(req, res, next) {
    if (req.session.profile) {
        var StudentId = res.locals.studentId;
        var data = { student_id: StudentId };
        // console.log(data);
        query.ShowUserOffsetApplyForm(data, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                result = JSON.parse(result);
                var list = {
                    waive_course: [],
                    exempt_course: [],
                    compulsory_course: [],
                    english_course: []
                };
                for (var i = 0; i < result.length; i++) {
                    //轉校轉系抵免
                    var agree_status = parseInt(result[i].agree);
                    if (agree_status == 1 || agree_status == 5)
                        agree_status = 0;
                    else if (agree_status == 2)
                        agree_status = 1;
                    else if (agree_status == 3 || agree_status == 4)
                        agree_status = 2;
                    else if (agree_status == 6)
                        agree_status = 3;
                    if (result[i].offset_type === "2") {
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
                    } else if (result[i].offset_type === "1") { // 英授抵免
                        var english = {
                            "timestamp": result[i].timestamp,
                            "apply_year": parseInt(result[i].apply_year),
                            "apply_semester": parseInt(result[i].apply_semester),
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
                    } else if (result[i].offset_type === "0") { // 外系抵免
                        var compulsory = {
                            "timestamp": result[i].timestamp,
                            "apply_year": parseInt(result[i].apply_year),
                            "apply_semester": parseInt(result[i].apply_semester),
                            "phone": result[i].phone,
                            "reason": {
                                "type": result[i].reason_type,
                                "content": result[i].reason
                            },
                            "department": result[i].cos_dep_old,
                            "teacher": result[i].cos_tname_old,
                            "credit": parseInt(result[i].credit),
                            "course_year": parseInt(result[i].cos_year_old),
                            "course_semester": parseInt(result[i].cos_semester_old),
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
                    } else if (result[i].offset_type === "3") {
                        var exempt = {
                            "timestamp": result[i].timestamp,
                            "phone": result[i].phone,
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
                            "file": result[i].file,
                            "current_course_type": result[i].cos_type,
                            "status": agree_status,
                            "reject_reason": result[i].reject_reason
                        };
                        list.exempt_course.push(exempt);
                    }
                }
            }
            req.info = list;
            if (req.info)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

/* 列出所有學生的抵免申請單 */
table.offsetApplyShow = function(req, res, next) {
    if (req.session.profile) {
        var data1 = { student_id: '0516003' };
        var data2 = { all_student: true };
        // var year = req.body.apply_year;
        // var sem = req.body.apply_semester;
        query.ShowUserOffsetApplyForm(data2, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                result = JSON.parse(result);
                //console.log(result);
                var group = [];
                for (var i = 0; i < result.length; i++) {
                    // if(result[i].apply_year != year || result[i].apply_semester != sem) continue;
                    var one = {
                        "apply_year": result[i].apply_year,
                        "apply_semester": parseInt(result[i].apply_semester),
                        "sid": result[i].student_id,
                        "name": result[i].sname,
                        "program": result[i].program,
                        "grade": result[i].grade,
                        "info": result[i].program + "大" + result[i].grade,
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
                        "transferTo": "",
                        "cos_year_old": result[i].cos_year_old,
                        "cos_semester_old": parseInt(result[i].cos_semester_old),
                        "resend": parseInt(result[i].resend) === 1 ? true : false
                    };
                    // "file": result[i].file,

                    if (one.type == 0) {
                        one.nameA = result[i].cos_cname;
                        one.codeA = result[i].cos_code;
                        one.creditA = parseInt(result[i].credit);
                        one.nameB = result[i].cos_cname_old;
                        one.codeB = result[i].cos_code_old;
                        one.creditB = parseInt(result[i].credit_old);
                    }
                    if (result[i].transferto != null)
                        one.transferTo = result[i].transferto;
                    group.push(one);
                }
                req.show = group;
                next();
                /*
                if (group.length == result.length) {
                    req.show = group;
                    if (req.show)
                        next();
                    else
                        return;
                } 
                */
            }
        });
    } else
        res.redirect('/');
}


table.offsetApplyFile = function(req, res, next) {
    if (req.session.profile) {
        var input = req.body;
        query.ShowUserOffsetApplyForm({ all_student: true }, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                result = JSON.parse(result);
                for (var i = 0; i < result.length; i++) {
                    if (result[i].timestamp !== input.date || result[i].student_id !== input.sid)
                        continue;
                    req.file = {
                        "file": result[i].file
                    }
                    next();
                }
            }
        });
    } else res.redirect('/');
}


// ----------------------------------------------------------------------offset table

// research table--------------------------------------------------------------------

/*  列出該年級所有學生的專題資訊 */
table.researchStudentList = function(req, res, next) {
    if (req.session.profile) {
        query.ShowGradeStudentIdList(req.body.grade, function(err, ID_list) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!ID_list)
                res.redirect('/');
            else {
                var project = [];
                var count = 0;
                var index = [];
                ID_list = JSON.parse(ID_list);
                for (var i = 0; i < ID_list.length; i++) {
                    var list = {
                        student: {
                            id: '',
                            name: '',
                            program: ''
                        },
                        project: {
                            status: 3,
                            title: '',
                            professor_name: ''
                        }
                    }
                    list.student.id = ID_list[i].student_id;
                    list.student.name = ID_list[i].sname;
                    list.student.program = ID_list[i].program;
                    index[ID_list[i].student_id] = count;
                    count++;
                    project.push(list);
                }
                for (var i = 0; i < ID_list.length; i++) {
                    query.ShowStudentResearchInfo(ID_list[i].student_id, function(err, research) {
                        if (err)
                            throw err;
                        if (!research)
                            res.redirect('/');
                        else {
                            research = JSON.parse(research);
                            if (research.length != 0) {
                                var id = index[research[research.length - 1].student_id];
                                if (research[research.length - 1].add_status == 0)
                                    project[id].project.status = 0;
                                else
                                    project[id].project.status = 1;
                                project[id].project.title = research[research.length - 1].research_title;
                                project[id].project.professor_name = research[research.length - 1].tname;
                            }
                        }
                    });
                }
                for (var i = 0; i < ID_list.length; i++) {
                    query.ShowStudentResearchApplyForm(ID_list[i].student_id, function(err, applyform) {
                        if (err)
                            throw err;
                        if (!applyform)
                            res.redirect('/');
                        else {
                            applyform = JSON.parse(applyform);
                            //console.log(applyform);
                            if (applyform.length != 0) {
                                //console.log(applyform[0].student_id);
                                var id = index[applyform[0].student_id.substring(0, 7)];

                                if (applyform[0].agree == 0 || applyform[0].agree == 2)
                                    project[id].project.status = 2;
                                //else if(applyform[0].agree == 3)
                                //  project[id].project.status =2;

                                project[id].project.title = applyform[0].research_title;
                                project[id].project.professor_name = applyform[0].tname;

                            }
                        }
                    });
                }
                setTimeout(function() {
                    req.studentList = project;
                    if (req.studentList)
                        next();
                    else
                        return;
                }, 500);
            }
        });
    } else
        res.redirect('/');
}

/* 列出所有學生的專題資訊 */
table.researchStudentListDownload = function(req, res, next) {
    if (req.session.profile) {
        var semester = req.body.semester;
        var first_second = parseInt(req.body.first_second);
        query.ShowStudentResearchList({ first_second: first_second, semester: semester }, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result)
            var teamIdList = [];
            var cnt = 1;
            var studentListDownload = result.map((student) => {
                if (teamIdList[student.unique_id] == null) {
                    teamIdList[student.unique_id] = cnt;
                    cnt++;
                }
                student['team_idx'] = teamIdList[student.unique_id];
                student['cos_cname'] = first_second == 1 ? '資訊工程專題(ㄧ)' : '資訊工程專題(二)';

                delete student['unique_id'];
                delete student['phone'];
                delete student['email'];
                delete student['first_second'];

                return student;
            })
            studentListDownload = studentListDownload.sort((a, b) => a.team_idx - b.team_idx);
            req.studentListDownload = studentListDownload;
            if (req.studentListDownload)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

/*table.researchStudentListDownload = function(req, res, next) {
    if (req.session.profile) {
        req.body.grade = '';
        var accept_num_semester = req.body.semester.substring(0, 3);
        var tid = { teacher_id: '' };
        query.ShowTeacherInfoResearchCnt(tid, function(err, ID_list) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!ID_list) res.redirect('/');
            else {
                var group = [];
                var Count = 0;
                var Index = [];
                ID_list = JSON.parse(ID_list);
                for (var i = 0; i < ID_list.length; i++) {
                    var list = {
                        professor_name: ID_list[i].tname,
                        accept_status: 0,
                        pending_status: 0,
                        gradeCnt: 0,
                        accepted: {
                            projects: [],
                        },
                        pending: {
                            projects: [],
                        },
                    };
                    for (var j = 0; j < ID_list[i].gradeCnt.length; j++) {
                        if (ID_list[i].gradeCnt[j].grade == accept_num_semester) {
                            list.gradeCnt = parseInt(ID_list[i].gradeCnt[j].scount);
                            break;
                        }
                    }
                    Index[ID_list[i].teacher_id] = Count;
                    Count++;
                    if (list.gradeCnt === null) list.gradeCnt = 0;
                    group.push(list);
                }
                var student_cnt = 0;
                for (var i = 0; i < ID_list.length; i++) {
                    query.ShowGradeTeacherResearchStudent(ID_list[i].teacher_id, req.body.grade, function(err, result) {
                        if (err) {
                            throw err;
                            return;
                        }
                        if (!result) return;
                        else {
                            result = JSON.parse(result);
                            var index = [];
                            var count = 0;
                            for (var j = 0; j < result.length; j++) {
                                if (index[result[j].unique_id] == null && result[j].semester == req.body.semester) {
                                    var project = {
                                        title: '',
                                        students: [],
                                        title_number: ''
                                    };
                                    project.title = result[j].research_title;
                                    var Id = Index[result[j].teacher_id];
                                    group[Id].accepted.projects.push(project);
                                    index[result[j].unique_id] = count;
                                    count++;
                                }
                            }
                            for (var j = 0; j < result.length; j++) {
                                if (result[j].semester == req.body.semester) {
                                    var student = {
                                        id: '',
                                        name: '',
                                        program: '',
                                        semester: '',
                                        first_second: '',
                                        status: null,
                                        add_status: 0
                                    };
                                    student.id = result[j].student_id;
                                    student.name = result[j].sname;
                                    student.program = result[j].class_detail;
                                    student.semester = result[j].semester;
                                    student.first_second = result[j].first_second;
                                    student.status = result[j].status;
                                    student.add_status = result[j].add_status;
                                    var id = index[result[j].unique_id];
                                    var Id = Index[result[j].teacher_id];
                                    group[Id].accepted.projects[id].students.push(student);
                                    student_cnt++;
                                    if (result[j].add_status == 0 && group[Id].accept_status == 0)
                                        group[Id].accept_status = 1;
                                }
                            }
                        }
                    });
                }
                for (var i = 0; i < ID_list.length; i++) {
                    query.ShowTeacherResearchApplyFormList(ID_list[i].teacher_id, function(err, result) {
                        if (err) {
                            throw err;
                            return;
                        }
                        if (!result) return;
                        else {
                            result = JSON.parse(result);
                            var index = [];
                            var count = 0;
                            for (var j = 0; j < result.length; j++) {
                                if (index[result[j].unique_id] == null) {
                                    var project = {
                                        title: '',
                                        students: [],
                                        title_number: '',
                                    };
                                    project.title = result[j].research_title;
                                    var Id = Index[result[j].teacher_id];
                                    group[Id].pending.projects.push(project);
                                    index[result[j].unique_id] = count;
                                    count++;

                                    if (group[Id].pending_status == 0) group[Id].pending_status = 1;
                                }
                            }
                            for (var j = 0; j < result.length; j++) {
                                var student = {
                                    id: '',
                                    name: '',
                                    program: '',
                                    first_second: '',
                                    status: null,
                                };
                                student.id = result[j].student_id;
                                student.name = result[j].sname;
                                student.program = result[j].program;
                                student.first_second = result[j].first_second;
                                student.status = result[j].status;
                                var id = index[result[j].unique_id];
                                var Id = Index[result[j].teacher_id];
                                group[Id].pending.projects[id].students.push(student);
                                student_cnt++;
                            }
                        }
                    });
                }
                var return_list = [];
                setTimeout(function() {
                    for (var i = 0; i < group.length; i++) {
                        var Tname = group[i].professor_name;
                        var project_ac_list = group[i].accepted.projects;
                        var project_pending_list = group[i].pending.projects;
                        for (var j = 0; j < project_ac_list.length; j++) {
                            var student_list = project_ac_list[j].students;
                            for (var k = 0; k < student_list.length; k++) {
                                var student = {
                                    student_id: '',
                                    sname: '',
                                    tname: '',
                                    research_title: '',
                                    first_second: '',
                                };
                                student.tname = Tname;
                                student.research_title = project_ac_list[j].title;
                                student.student_id = student_list[k].id;
                                student.sname = student_list[k].name;
                                student.first_second = student_list[k].first_second;
                                return_list.push(student);
                            }
                        }
                        for (var j = 0; j < project_pending_list.length; j++) {
                            var student_list = project_pending_list[j].students;
                            for (var k = 0; k < student_list.length; k++) {
                                var student = {
                                    student_id: '',
                                    sname: '',
                                    tname: '',
                                    research_title: '',
                                    first_second: '',
                                };
                                student.tname = Tname;
                                student.research_title = project_pending_list[j].title;
                                student.student_id = student_list[k].id;
                                student.sname = student_list[k].name;
                                student.first_second = student_list[k].first_second;
                                return_list.push(student);
                            }
                        }
                    }
                    if (return_list.length == student_cnt) {
                        req.studentListDownload = return_list;
                        if (req.studentListDownload)
                            next();
                        else
                            return;
                    }
                }, 1000);
            }
        });
    } else
        res.redirect('/');
}*/

/* 列出該教授的專題學生資訊 */
table.researchProfessorList = function(req, res, next) {
    let year = req.body.year;
    let year_semester = req.body.year + '-' + req.body.semester;

    let promiseShowTeacherInfoResearchCnt = () => new Promise((resolve, reject) => {
        if (!req.session.profile)
            reject('Student profile not found.');
        else {
            query.ShowTeacherInfoResearchCnt({ teacher_id: '' }, (error, result) => {
                if (error) reject('Cannot fetch ShowTeacherInfoResearchCnt. Error message: ' + error);
                if (!result) reject('Cannot fetch ShowTeacherInfoResearchCnt.');
				else resolve(JSON.parse(result));
            });
        }
    });

    let promiseShowGradeTeacherResearchStudent = (teacher_id) => new Promise((resolve, reject) => {
        if (!req.session.profile)
            reject('Student profile not found.');
        else {
            query.ShowGradeTeacherResearchStudent(teacher_id, '', (error, result) => {
                if (error) reject('Cannot fetch ShowGradeTeacherResearchStudent. Error message: ' + error);
                if (!result) reject('Cannot fetch ShowGradeTeacherResearchStudent.');
				else resolve(JSON.parse(result));
            });
        }
    });

    let promiseShowTeacherResearchApplyFormList = (teacher_id) => new Promise((resolve, reject) => {
        if (!req.session.profile)
            reject('Student profile not found.');
        else {
            query.ShowTeacherResearchApplyFormList(teacher_id, (error, result) => {
                if (error) reject('Cannot fetch ShowTeacherResearchApplyFormList. Error message: ' + error);
                if (!result) reject('Cannot fetch ShowTeacherResearchApplyFormList.');
				else resolve(JSON.parse(result));
            });
        }
    });

    let teacher_list = [];
    let teacher_index = {};
    let promiseList_apply = [];
    let promiseList = [];

    promiseShowTeacherInfoResearchCnt()
        .then((result) => {
            let cnt = 0;
            result.forEach((teacher) => {
                let list = {
                    professor_name: teacher.tname,
                    professor_id: teacher.teacher_id,
                    accept_status: 0,
                    pending_status: 0,
                    gradeCnt: 0,
                    accepted: {
                        projects: []
                    },
                    pending: {
                        projects: []
                    }
                };
                let flag = 0;
                teacher.gradeCnt.forEach((gradeCnt) => {
                    if (flag == 0 && gradeCnt.grade == year) {
                        list.gradeCnt = parseInt(gradeCnt.scount);
                        flag == 1;
                    }
                });
                teacher_index[teacher.teacher_id] = cnt;
                cnt++;
                if (list.gradeCnt === null)
                    list.gradeCnt = 0;
                teacher_list.push(list);
                promiseList.push(promiseShowGradeTeacherResearchStudent(teacher.teacher_id));
                promiseList_apply.push(promiseShowTeacherResearchApplyFormList(teacher.teacher_id));
            });

            return Promise.all(promiseList);
        })
        .then((result) => {
            let research_index = {};
            result.forEach((students_of_teacher) => {
                if(students_of_teacher.length == 0) return;
                students_of_teacher.forEach((student) => {
                    if ((student.semester == year_semester) && ((student.first_second == req.body.first_second) || ((student.first_second == '3') && (req.body.first_second == '1')))) {
                        if (research_index[student.unique_id] == null) {
                            let project = {
                                title: student.research_title,
                                students: [],
                            }
                            let teacher_idx = teacher_index[student.teacher_id];
                            research_index[student.unique_id] = teacher_list[teacher_idx].accepted.projects.length;
                            teacher_list[teacher_idx].accepted.projects.push(project);
                        }

                        let student_info = {
                            id: student.student_id,
                            name: student.sname,
                            program: student.class_detail,
                            semester: student.semester,
                            first_second: student.first_second,
                            status: student.status,
                            add_status: student.add_status,
                            score: student.score == null ? null : parseInt(student.score),
                            comment: student.comment,
                            cpe_status: student.CPEStatus,
                        }
                        let research_idx = research_index[student.unique_id];
                        let teacher_idx = teacher_index[student.teacher_id];
                        teacher_list[teacher_idx].accepted.projects[research_idx].students.push(student_info);
                        if ((student.add_status == 0) && (teacher_list[teacher_idx].accept_status == 0))
                            teacher_list[teacher_idx].accept_status = 1;
                    }
                });
            });
            return Promise.all(promiseList_apply);
        })
        .then((result) => {
            let research_index = {};
            result.forEach((students_of_teacher) => {
                if(students_of_teacher.length == 0) return;
                students_of_teacher.forEach((student) => {
                    if ((student.semester == year_semester) && ((student.first_second == req.body.first_second) || ((student.first_second == '3') && (req.body.first_second == '1')))) {
                        if (research_index[student.unique_id] == null) {
                            let project = {
                                title: student.research_title,
                                students: [],
                            }
                            let teacher_idx = teacher_index[student.teacher_id];
                            research_index[student.unique_id] = teacher_list[teacher_idx].pending.projects.length;
                            teacher_list[teacher_idx].pending.projects.push(project);
                            if (teacher_list[teacher_idx].pending_status == 0)
                                teacher_list[teacher_idx].pending_status = 1;
                        }

                        let student_info = {
                            id: student.student_id,
                            name: student.sname,
                            program: student.class_detail,
                            semester: student.semester,
                            first_second: student.first_second,
                            status: student.status,
                            cpe_status: student.CPEStatus
                        }
                        let research_idx = research_index[student.unique_id];
                        let teacher_idx = teacher_index[student.teacher_id];
                        teacher_list[teacher_idx].pending.projects[research_idx].students.push(student_info);
                    }
                });
            });
            teacher_list.forEach(teacher => {
                teacher.pending.projects = teacher.pending.projects.filter(project => {
                    if (project.students.some(student => student.cpe_status == '2'))
                        return false;
                    else return true;
                });
            })
            req.professorList = teacher_list;
            if (req.professorList)
                next();
        })
        .catch((error) => {
            console.log(error);
            res.redirect('/');
        });
}

/*  列出該學期專題一或二的所有成績資訊 */
table.researchGradeList = function(req, res, next) {
    if (req.session.profile) {
        var input = { semester: req.body.semester, first_second: req.body.first_second };
        query.ShowResearchScoreComment(input, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                result = JSON.parse(result);
                var index = [];
                var groups = [];
                for (var i = 0; i < result.length; i++) {
                    var list = {
                        professor_name: '',
                        student: {
                            id: '',
                            name: '',
                            score: null,
                            comment: ''
                        }
                    }
                    list.professor_name = result[i].tname;
                    list.student.id = result[i].student_id;
                    list.student.name = result[i].sname;
                    list.student.score = parseInt(result[i].score);
                    list.student.comment = result[i].comment;
                    list.student.research_title = result[i].research_title;
                    groups.push(list);
                }
                if (groups.length == result.length) {
                    req.gradeList = groups;
                    if (req.gradeList)
                        next();
                    else
                        return;
                }
            }
        });

    } else
        res.redirect('/');
}

/* 該學期專題一或二的成績表下載 */
table.researchGradeDownload = function(req, res, next) {
    if (req.session.profile) {
        var input = { semester: req.body.semester, first_second: req.body.first_second };
        query.ShowResearchScoreComment(input, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result)
            req.gradeDownload = result;
            if (req.gradeDownload)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

/* 助理更改該學生專題成績和評論 */
table.researchSetScore = function(req, res, next) {
    if (req.session.profile) {
        var content = {
            student_id: req.body.student_id,
            tname: req.body.tname,
            research_title: req.body.research_title,
            first_second: parseInt(req.body.first_second),
            semester: req.body.semester,
            new_score: parseInt(req.body.new_score),
            new_comment: req.body.new_comment
        };
        query.SetResearchScoreComment(content);
        setTimeout(function() {
            res.status = 200;
            next();
        }, 800);
    } else
        res.redirect('/');
}

/* 刪除該學生的專題資訊(讓助理可以刪掉沒選課的人的專題)
有人沒有選課, 刪掉他個人的資料, 並且寄"沒有選課的信"給個人, cc給教授 */
table.researchDelete = function(req, res, next) {
    if (req.session.profile) {

        var type = req.body.type;

        let promiseDeleteResearch = (info) => new Promise((resolve, reject) => {
            query.DeleteResearch(info, (error, result) => {
                if (error) reject('Cannot fetch DeleteResearch. Error message: ' + error);
                if (!result) reject('Cannot fetch DeleteResearch.');
                else resolve();
            });
        });

        let promiseDeleteResearchApplyForm = (info) => new Promise((resolve, reject) => {
            query.DeleteResearchApplyForm(info, (error, result) => {
                if (error) reject('Cannot fetch DeleteResearchApplyForm. Error message: ' + error);
                if (!result) reject('Cannot fetch DeleteResearchApplyForm.');
                else resolve();
            });
        });

        let promiseShowUserInfo = (id) => new Promise((resolve, reject) => {
            query.ShowUserInfo(id, (error, result) => {
                if (error) reject('Cannot fetch ShowUserInfo. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowUserInfo.');
                else resolve(JSON.parse(result)[0]);
            });
        });

        let promiseShowStudentResearchInfo = (id) => new Promise((resolve, reject) => {
            query.ShowStudentResearchInfo(id, (error, result) => {
                if (error) reject('Cannot fetch ShowStudentResearchInfo. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowStudentResearchInfo.');
                else resolve(JSON.parse(result)[0]);
            });
        });

        let promiseShowStudentResearchApplyForm = (id) => new Promise((resolve, reject) => {
            query.ShowStudentResearchApplyForm(id, (error, result) => {
                if (error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
                else resolve(JSON.parse(result)[0]);
            });
        });

        let promiseShowTeacherIdList = () => new Promise((resolve, reject) => {
            query.ShowTeacherIdList((error, result) => {
                if (error) reject('Cannot fetch ShowTeacherIdList. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowTeacherIdList.');
                else resolve(JSON.parse(result));
            });
        });

        let promiseDelete = (type) => {
            if (type == '0') {
                return Promise.all([promiseShowStudentResearchApplyForm(req.body.student_id), promiseShowTeacherIdList()])
                    .then(([researchApplyInfo, teacherIdList]) => {
                        let tname = researchApplyInfo.tname;
                        var teacher = teacherIdList.find(teacher => teacher.tname == tname);
                        let teacherEmail = teacher.email;
                        let studentEmail = researchApplyInfo.email;
                        let info = { semester: researchApplyInfo.semester, unique_id: researchApplyInfo.unique_id}
                        return Promise.all([
                            teacherEmail,
                            studentEmail,
                            promiseDeleteResearchApplyForm(info)
                        ])
                    });
            } else if (type == '1') {
                return Promise.all([promiseShowStudentResearchInfo(req.body.student_id), promiseShowUserInfo(req.body.student_id), promiseShowTeacherIdList()])
                    .then(([researchInfo, userInfo, teacherIdList]) => {
                        let tname = researchInfo.tname;
                        var teacher = teacherIdList.find(teacher => teacher.tname == tname);
                        let teacherEmail = teacher.email;
                        let studentEmail = userInfo.email;
                        let info = { student_id: req.body.student_id, first_second: req.body.first_second, semester: req.body.semester };
                        return Promise.all([
                            teacherEmail,
                            studentEmail,
                            promiseDeleteResearch(info)
                        ])
                    });
            }
        }

        Promise.all(promiseDelete(type))
            .then(([teacherEmail, studentEmail, _]) => {
                let options = {
                    from: 'nctucsca@gmail.com',
                    to: studentEmail,
                    cc: teacherEmail,
                    bcc: '',
                    subject: '[交大資工線上助理]專題郵件通知', // Subject line
                    html: '同學好,<p><br/>您的專題申請被退回。原因如下：<p>1.      本學期未完成專題選課。<p><br/>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>'
                };

                transporter.sendMail(options, function(error, info) {
                    if (error) {
                        return Promise.reject('Error sending emails.');
                    }
                });
                res.status = 200;
                next();
            })
            .catch((error) => {
                console.log(error);
                res.status = 403;
                next();
            });

    } else {
        res.redirect('/');
    }
}

/* 刪除該學生的專題資訊(讓助理可以刪掉CPE未過但被教授同意的人的專題) */
/*table.researchDelete = function(req, res, next) {
    if (req.session.profile) {
        var info = { student_id: req.body.student_id, first_second: req.body.first_second, semester: req.body.semester };

        let promiseDeleteResearch = (info) => new Promise((resolve, reject) => {
            query.DeleteResearch(info, (error, result) => {
                if (error) reject('Cannot fetch CreateResearchApplyForm. Error message: ' + error);
                if (!result) reject('Cannot fetch CreateResearchApplyForm.');
                else resolve();
            });
        });

        let promiseShowUserInfo = (id) => new Promise((resolve, reject) => {
            query.ShowUserInfo(id, (error, result) => {
                if (error) reject('Cannot fetch ShowUserInfo. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowUserInfo.');
                else resolve(JSON.parse(result)[0]);
            });
        });

        Promise.all(promiseDeleteResearch(info), promiseShowUserInfo(req.body.student_id))
            .then(result => {
                let email = result.email
                let options = {
                    from: 'nctucsca@gmail.com',
                    to: email,
                    cc: '',
                    bcc: '',
                    subject: '', // Subject line
                    html: '同學好,<p><br/>您的專題(一)申請未通過。可能的原因如下：<p>1.如為多人一組：貴組專題（一）成員中有學生尚未通過「基礎程式設計課程」，故無法受理貴組的專題（一）申請，請重新提送申請單。<p>2.如為個人申請：您尚未通過「基礎程式設計課程」，不可選修專題（一）。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>'
                };

                transporter.sendMail(options, function(error, info) {
                    if (error) {
                        return Promise.reject('Error sending emails.');
                    }
                });
                res.status = 200;
                next();
            })
            .catch((error) => {
                console.log(error);
                res.status = 403;
                next();
            });

    } else {
        res.redirect('/');
    }
}*/

/* 刪除該學生的專題資訊(讓助理可以刪掉CPE未過但被教授同意的人的專題) */
/*table.researchDelete = function(req, res, next) {
    if (req.session.profile) {
        var info = { student_id: req.body.student_id, first_second: req.body.first_second, semester: req.body.semester };
        query.DeleteResearch(info, function(err, result) {
            if (err) {
                req.signal = 403;
                throw err;
            }
            if (!result) {
                req.signal = 403;
                next();
            } else {
                req.signal = 200;
                next();
            }
        });
    } else {
        res.redirect('/');
    }
}*/

/* 修改專題資料的 add_status, 0代表尚未加選 1代表已加選 */
table.researchSetAddStatus = function(req, res, next) {
    if (req.session.profile) {
        var info = {
            student_id: req.body.student_id,
            research_title: req.body.research_title,
            semester: req.body.semester,
            first_second: req.body.first_second,
            add_status: 1
        };
        query.SetResearchAddStatus(info, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result);
            req.setAddStatus = result;
            if (req.setAddStatus)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

/* CPE沒過, 拒絕申請單不刪掉資料庫資料, 並且寄"有人CPE沒過的信"給他們的組員還有他 */
table.researchSetCPEStatus = function(req, res, next) {
    if (req.session.profile) {
        let input = { student_id: req.body.student_id, cpe_result: parseInt(req.body.new_cpe_status) };
        
        let promiseShowStudentResearchApplyForm = (id) => new Promise((resolve, reject) => {
            query.ShowStudentResearchApplyForm(id, (error, result) => {
                if (error) reject('Cannot fetch ShowStudentResearchApplyForm. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowStudentResearchApplyForm.');
                else resolve(JSON.parse(result)[0]);
            });
        });

        let promiseShowTeacherIdList = () => new Promise((resolve, reject) => {
            query.ShowTeacherIdList((error, result) => {
                if (error) reject('Cannot fetch ShowTeacherIdList. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowTeacherIdList.');
                else resolve(JSON.parse(result));
            });
        });

        let promiseShowTeacherResearchApplyFormList = (teacherId) => new Promise((resolve, reject) => {
            query.ShowTeacherResearchApplyFormList(teacherId, (error, result) => {
                if (error) reject('Cannot fetch ShowTeacherResearchApplyFormList. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowTeacherResearchApplyFormList.');
                else resolve(JSON.parse(result));
            });
        });

        let promiseSetResearchApplyFormStatus = (semester, uniqueId) => new Promise((resolve, reject) => {
            query.SetResearchApplyFormStatus({ semester: semester, agree: 3, unique_id: uniqueId });
            resolve();
        });

        let promiseSetCPEStatus = (info) => new Promise((resolve, reject) => {
            query.SetCPEStatus(info, (error, result) => {
                if (error) reject('Cannot fetch SetCPEStatus. Error message: ' + error);
                else if (!result) reject('Cannot fetch SetCPEStatus.');
                else resolve();
            });
        });

        let promiseList = [];
        promiseList.push(promiseShowStudentResearchApplyForm(req.body.student_id));
        promiseList.push(promiseShowTeacherIdList());
        promiseList.push(promiseSetCPEStatus(input));

        let promiseCPENotPass = () => Promise.all(promiseList)
            .then(([applyForm, teacherIdList, _]) => {
                var teacher = teacherIdList.find(teacher => teacher.tname == applyForm.tname);
                return Promise.all([
                    promiseShowTeacherResearchApplyFormList(teacher.teacher_id),
                    promiseSetResearchApplyFormStatus(applyForm.semester, applyForm.unique_id)
                ]);
            })
            .then(([applyFormList, _]) => {
                var unique_id = applyFormList.find(applyForm => applyForm.student_id == req.body.student_id).unique_id;
                let memberIdList = applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.student_id)
                let memberEmailList = applyFormList.filter(applyForm => applyForm.unique_id == unique_id).map(applyForm => applyForm.email)
                return [memberIdList, memberEmailList]
            })
            .then(([memberIdList, memberEmailList]) => {
                let memberEmails = memberEmailList.join();
                let transporter = nodemailer.createTransport({
                    service: 'Gmail',
                    auth: mail_info.auth
                });

                let options = {
                    from: 'nctucsca@gmail.com',
                    to: memberEmails,
                    cc: '',
                    bcc: '',
                    subject: '[交大資工線上助理]專題申請郵件通知',
                    html: '同學好,<p><br/>您的專題(一)申請未通過。可能的原因如下：<p>1.如為多人一組：貴組專題（一）成員中有學生尚未通過「基礎程式設計課程」，故無法受理貴組的專題（一）申請，請重新提送申請單。<p>2.如為個人申請：您尚未通過「基礎程式設計課程」，不可選修專題（一）。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><p>請進入交大資工線上助理核可申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>'
                };

                transporter.sendMail(options, (error, result) => {
                    if (error) return console.log('Cannot send email. Error message: ' + error);
                });
            })
            .then(_ => {
                res.status(200);
                next();
            })
            .catch(error => {
                console.log(error);
                res.status(403);
                next();
            });

        if (req.body.new_cpe_status == '2'){
            promiseCPENotPass();
        }
        else {
            query.SetCPEStatus(input, function(err, result) {
                if (err) {
                    res.status = 403;
                    throw err;
                }
                if (!result) {
                    res.status = 403;
                    next();
                } else {
                    res.status = 200;
                    next();
                }
            });
        }

    } else {
        res.redirect('/');
    }
}

/*table.researchSetCPEStatus = function(req, res, next) {
    if (req.session.profile) {
        let input = { student_id: req.body.student_id, cpe_result: parseInt(req.body.new_cpe_status) };
        query.SetCPEStatus(input, function(err, result) {
            if (err) {
                res.status = 403;
                throw err;
            }
            if (!result) {
                res.status = 403;
                next();
            } else {
                res.status = 200;
                next();
            }
        });
    } else {
        res.redirect('/');
    }
}*/

table.researchSendWarningEmail = function(req, res, next) {
    let promiseList = [];
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: mail_info.auth
    });

    let type = parseInt(req.body.type);

    let studentGoToDinoApplyResearchMailContent = '同學好,<p><br/>本學期您已選修「資訊工程專題（一）」，但尚未至本系dinodino系統（https://dinodino.nctu.edu.tw/）送出專題（一）申請，敬請於開學一週內完成填送，以免影響期末評分作業。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><p>請進入交大資工線上助理填寫申請表/確認申請表狀態：<a href = "https://dinodino.nctu.edu.tw"> 點此進入系統</a></p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>';
    let studentGoToSelectCosMailContent = '同學好,<p><br/>本學期您已於本系dinodino系統送出專題（一）申請，但尚未完成選修「資訊工程專題（一）」課程。敬請於加退選結束前依公告完成選課。加退選結束後未完成專題（一）選修者，將退回dinodino系統專題（一）申請。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>';
    let professorGoToSetFirstScoreMailContent = '老師好：<p><br/>提醒您，您尚有專題（一）課程未完成評分，敬請登入本系dinodino系統（https://dinodino.nctu.edu.tw/）完成評分。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>';
    let professorGoToSetSecondScoreMailContent = '老師好：<p><br/>提醒您，您尚有專題（二）課程未完成評分，敬請登入本系dinodino系統（https://dinodino.nctu.edu.tw/）完成評分。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>';
    let professorGoToSetApplyFormStatusMailContent = '老師好：<p><br/>提醒您，您尚有專題（一）申請表未完成簽核，敬請登入本系dinodino系統（https://dinodino.nctu.edu.tw/）完成簽核，並於開學後二週內送出。<p>如有任何問題請儘速與系辦聯繫。<p><br/><br/>資工系辦　敬啟</p><p>-----------------------------------------------</p><p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請至系辦詢問助理，謝謝。</p><br/><p>Best Regards,</p><p>交大資工線上助理 NCTU CSCA</p><p>-----------------------------------------------</p>';

    let studentGoToDinoApplyResearchMailSubject = '［資工系］提醒您至本系dinodino系統送出專題（一）申請';
    let studentGoToSelectCosMailSubject = '［資工系］提醒您完成選修資訊工程專題（一）課程';
    let professorGoToSetFirstScoreMailSubject = '[提醒］專題（一）評分';
    let professorGoToSetSecondScoreMailSubject = '[提醒］專題（二）評分';
    let professorGoToSetApplyFormStatusMailSubject = '[提醒］專題（一）申請簽核';

    let mailContentList = [studentGoToDinoApplyResearchMailContent, studentGoToSelectCosMailContent, professorGoToSetFirstScoreMailContent, professorGoToSetSecondScoreMailContent, professorGoToSetApplyFormStatusMailContent];
    let mailSubjectList = [studentGoToDinoApplyResearchMailSubject, studentGoToSelectCosMailSubject, professorGoToSetFirstScoreMailSubject, professorGoToSetSecondScoreMailSubject, professorGoToSetApplyFormStatusMailSubject];

    let promiseShowUserInfo = (id) => new Promise((resolve, reject) => {
        query.ShowUserInfo(id, (error, result) => {
            if (error) reject('Cannot fetch ShowUserInfo. Error message: ' + error);
            else if (!result) reject('Cannot fetch ShowUserInfo.');
            else resolve(JSON.parse(result)[0]);
        });
    });

    req.body.people.forEach((person) => {
        promiseList.push(promiseShowUserInfo(person.id));
    });

    Promise.all(promiseList)
        .then(result => result.map(info => { return { name: info.sname, email: info.email } }))
        .then(result => {
            let emails = result.map(info => info.email).join();
            let options = {
                from: 'nctucsca@gmail.com',
                to: emails,
                cc: /*req.body.sender_email*/ '',
                bcc: '',
                subject: mailSubjectList[type], // Subject line
                html: mailContentList[type]
            };

            transporter.sendMail(options, function(error, info) {
                if (error) {
                    return Promise.reject('Error sending emails.');
                }
            });
            res.status = 200;
            next();
        })
        .catch((error) => {
            console.log(error);
            res.status = 403;
            next();
        });
}

/* 回傳選課有選專題但不在專題和專題申請表的學生學號 */
table.researchNotInSystemList = function(req, res, next) {
    if (req.session.profile) {
        var input = { semester: req.body.semester, first_second: parseInt(req.body.first_second) };
        query.ShowOnCosButNotInDBStudentList(input, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result)
            var list = result.map((student) => {
                student['id'] = student['student_id'];
                student['name'] = student['sname'];
                delete student['student_id'];
                delete student['sname'];
                return student;
            })
            req.notInSystemList = list;
            if (req.notInSystemList)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

/* 回傳在專題或專題申請表但選課沒有選專題的學生 */
table.researchNotOnCosList = function(req, res, next) {
    if (req.session.profile) {
        var input = { semester: req.body.semester, first_second: parseInt(req.body.first_second) };
        query.ShowInDBButNotOnCosStudentList(input, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result)
            var list = result.map((student) => {
                student['id'] = student['student_id'];
                student['name'] = student['sname'];
                delete student['student_id'];
                delete student['sname'];
                return student;
            })
            req.notOnCosList = list;
            if (req.notOnCosList)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

table.researchGetCPEStatus = function(req, res, next) {
    if (req.session.profile) {
        var input = { semester: req.body.semester, cpe_status: parseInt(req.body.cpe_status) };
		query.ShowResearchStudentGivenSemesterCPE(input, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result)
            var list = result.map((student) => {
                student['id'] = student['student_id'];
                student['name'] = student['sname'];
                delete student['student_id'];
                delete student['sname'];
                return student;
            })
            req.getCPEStatus = list;
            if (req.getCPEStatus)
                next();
            else
                return;
        });
    } else
        res.redirect('/');
}

table.researchWithdrawList = function(req, res, next) {
    if (req.session.profile) {
        var semester = req.body.semester;
        var first_second = req.body.first_second;
        var tidInput = { teacher_id: '' };
        var withdrawList = [];

        let promiseShowTeacherInfoResearchCnt = (tid) => new Promise((resolve, reject) => {
            query.ShowTeacherInfoResearchCnt(tid, (error, result) => {
                if (error) reject('Cannot fetch ShowTeacherInfoResearchCnt. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowTeacherInfoResearchCnt.');
                else resolve(JSON.parse(result));
            });
        });

        let promiseShowGradeTeacherResearchStudent = (tid) => new Promise((resolve, reject) => {
            query.ShowGradeTeacherResearchStudent(tid, '', (error, result) => {
                if (error) reject('Cannot fetch ShowGradeTeacherResearchStudent. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowGradeTeacherResearchStudent.');
                else resolve(JSON.parse(result));
            });
        });

        let promiseShowTeacherResearchApplyFormList = (tid) => new Promise((resolve, reject) => {
            query.ShowTeacherResearchApplyFormList(tid, (error, result) => {
                if (error) reject('Cannot fetch ShowTeacherResearchApplyFormList. Error message: ' + error);
                else if (!result) reject('Cannot fetch ShowTeacherResearchApplyFormList.');
                else resolve(JSON.parse(result));
            });
        });

        var promiseResearchList = [];
        var promiseApplyFormList = [];

        promiseShowTeacherInfoResearchCnt(tidInput)
            .then((teacherList) => {
                let tidList = teacherList.map((teacher) => teacher.teacher_id);
                promiseResearchList = tidList.map((tid) => promiseShowGradeTeacherResearchStudent(tid));
                promiseApplyFormList = tidList.map((tid) => promiseShowTeacherResearchApplyFormList(tid));
                return Promise.all(promiseResearchList);
            })
            .then((allTeacherResearchList) => {
                allTeacherResearchList.forEach((oneTeacherResearchList) => {
                    if (oneTeacherResearchList.length == 0) return;
                    oneTeacherResearchList.forEach((student) => {
                        if (student.semester != semester || student.add_status == '1' || student.first_second != first_second)
                            return;
                        var researchStudent = {
                            id: "",
                            name: "",
                            research_title: "",
                            type: ""
                        }
                        researchStudent.id = student.student_id;
                        researchStudent.name = student.sname;
                        researchStudent.research_title = student.research_title;
                        researchStudent.type = '1';
                        withdrawList.push(researchStudent);
                    })
                })
                return Promise.all(promiseApplyFormList);
            })
            .then((allTeacherApplyFormList) => {
                allTeacherApplyFormList.forEach((oneTeacherApplyFormList) => {
                    if (oneTeacherApplyFormList.length == 0) return;
                    oneTeacherApplyFormList.forEach((student) => {
                        if (student.semester != semester || student.first_second != first_second)
                            return;
                        var applyStudent = {
                            id: "",
                            name: "",
                            research_title: "",
                            type: ""
                        }
                        applyStudent.id = student.student_id;
                        applyStudent.name = student.sname;
                        applyStudent.research_title = student.research_title;
                        applyStudent.type = '0';
                        withdrawList.push(applyStudent);
                    })
                })
                req.withdrawList = withdrawList;
                if (req.withdrawList)
                    next();
            })
            .catch((error) => {
                console.log(error);
                res.redirect('/');
            });
    } else
        res.redirect('/');
}

// --------------------------------------------------------------------research table

// graduate table--------------------------------------------------------------------

/* 該年級所有學生的畢業預審下載 */
table.graduateStudentListDownload = function(req, res, next) {
    if (req.session.profile) {
        var graduateList = [];
        var grade = { grade: req.body.grade };
        query.ShowGivenGradeStudentID(grade, function(error, studentList) {
            if (error) {
                throw error;
                res.redirect('/');
            }
            if (!studentList)
                res.redirect('/');
            studentList = JSON.parse(studentList);
            for (var i = 0; i < studentList.length; i++) {
                var student_id = { student_id: studentList[i].student_id };
                query.ShowStudentGraduate(student_id, function(err, result) {
                    if (err) {
                        throw err;
                        res.redirect('/');
                    }
                    if (!result)
                        res.redirect('/');
                    result = JSON.parse(result);
                    graduateList.push(result);
                });
            }
        });
        setTimeout(function() {
            req.studentListDownload = graduateList;
            if (req.studentListDownload)
                next();
            else
                return;
        }, 1000);
    } else
        res.redirect('/');
}

/* 列出該年級所有學生的畢業預審 */
table.graduateStudentList = function(req, res, next) {
    var grades = { grade: req.body.grade };
    var list = [];
    if (req.session.profile) {
        query.ShowGivenGradeStudentID(grades, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            } else if (!result) {
                res.redirect('/');
            } else {
                var all_result = JSON.parse(result);
                for (var i = 0; i < all_result.length; i++) {
                    var studentID = { student_id: all_result[i].student_id };
                    // var studentID = {student_id: '0616220'};
                    // list.push(studentID);
                    query.ShowStudentGraduate(studentID, function(err, graduate_result) {
                        if (err) {
                            throw err;
                            res.redirect('/');
                        } else if (!graduate_result) {
                            res.redirect('/');
                        } else {
                            var output = JSON.parse(graduate_result)
                            output.map(student => {
                                if (student.submit_status === null) { student.submit_status = 0; }
                                if (student.submit_type === null) { student.submit_type = 0; }
                                if (student.en_status === null) { student.en_status = 0; }
                                student.submit_status = parseInt(student.submit_status);
                                list.push(student);
                                // list.push(studentID);
                            });
                            // list.push(studentID);
                            // list.push(JSON.parse(graduate_result));
                        }
                    });
                }
            }
        });
        setTimeout(function() {
            req.studentList = list;
            if (req.studentList)
                next();
            else
                return;
        }, 500);
    } else {
        res.redirect('/');
    }
}

/* 改變某學生的畢業送審狀態 */
table.postGraduateCheck = function(req, res, next) {
    if (req.session.profile) {
        var data = {
            id: req.body.student_id,
            graduate_submit: req.body.graduate_submit
        };
        if (req.body.graduate_submit == 3) {
            data.reject_reason = req.body.reason;
        }
        //console.log(data);
        query.SetGraduateSubmitStatus(data, function(err, res) {
            if (err) {
                throw err;
                res.redirect('/');
            } else if (!res) {
                res.redirect('/');
            }
        });
        next();
    } else
        res.redirect('/');
}

/* 改變某學生畢業預審 */
table.graduateStudentListUpdate = function(req, res, next) {
    var courseResult = res.locals.courseResult;
    var studentId = res.locals.studentId;
    query.ShowUserInfo(studentId, function(err, result) {
        if (err) {
            throw err;
            res.redirect('/');
        } else if (!result) {
            res.redirect('/');
        } else {
            //res.send(result);
            var [info] = JSON.parse(result);
            var list = {
                'student_id': '',
                'sname': '',
                'program': '',
                'total_credit': 0,
                'en_course': 0,
                'submit_status': 0,
                'graduate_status': 0,
                'pro': 1,
                'other': 1,
                'net': [],
                'media': [],
                'submit_type': -1,
                'old_total': 1,
                'old_contemp': 2,
                'old_culture': 2,
                'old_history': 2,
                'old_citizen': 2,
                'old_group': 2,
                'old_science': 2,
                'new_total': 1,
                'new_core_total': 0,
                'new_core_society': 2,
                'new_core_humanity': 2,
                'new_basic': 1,
                'new_cross': 1,
                'en_status': 1,
                'en_total': 1,
                'en_basic': 1,
                'en_advanced': 1,
                'en_uncertified': 0,
                'pe': 6,
                'service': 2,
                'art': 2,
                'mentor': 2,
                'compulse': [],
                'current': []
            };

            var will_list = {
                'total': 0,
                'compulse': 0,
                'pro': 0,
                'other': 0,
                'en_total': 0,
                'en_basic': 0,
                'en_advanced': 0,
                'en_uncertified': 0,
                'old_total': 0,
                'old_contemp': 0,
                'old_culture': 0,
                'old_history': 0,
                'old_citizen': 0,
                'old_group': 0,
                'old_science': 0,
                'new_total': 0,
                'new_core_total': 0,
                'new_core_society': 0,
                'new_core_humanity': 0,
                'new_basic': 0,
                'new_cross': 0,
                'pe': 0,
                'service': 0,
                'art': 0,
                'mentor': 0,
                'en_course': 0,
                'net': 9,
                'media': 9
            };

            var [compulse, pro, other, lang, general_old, general_new, pe, service, art, exclusion, graduate, addition_program, total, english] = courseResult;
            list.student_id = info.student_id;
            list.sname = info.sname;
            list.program = info.program;

            if (info.graduate_submit === null) { info.graduate_submit = '0'; }
            list.submit_status = parseInt(info.graduate_submit);


            //general_old

            if (info.submit_type === null) { info.submit_type = '0'; }
            list.submit_type = parseInt(info.submit_type);
            list.old_total = general_old.require - general_old.acquire;
            var mapping = { '文化': 'culture', '公民': 'citizen', '群己': 'group', '自然': 'science', '歷史': 'history', '通識': 'contemp' };
            var old = {
                'culture': 2,
                'citizen': 2,
                'group': 2,
                'science': 2,
                'history': 2,
                'contemp': 2
            };
            var will_old = {
                'culture': 0,
                'citizen': 0,
                'group': 0,
                'science': 0,
                'history': 0,
                'contemp': 0
            };
            for (var i = 0; i < general_old.course.length; i++) {
                if (general_old.course[i].complete) {
                    old[mapping[general_old.course[i].dimension]] -= general_old.course[i].realCredit;
                } else {
                    if (general_old.course[i].reason === 'now') {
                        will_list.total += general_old.course[i].originalCredit;
                        will_list.old_total += general_old.course[i].originalCredit;
                        will_old[mapping[general_old.course[i].dimension]] += general_old.course[i].originalCredit;
                    }
                }
            }
            list.old_culture = old.culture;
            list.old_citizen = old.citizen;
            list.old_group = old.group;
            list.old_science = old.science;
            list.old_history = old.history;
            list.old_contemp = old.contemp;
            will_list.old_culture = will_old.culture;
            will_list.old_citizen = will_old.citizen;
            will_list.old_group = will_old.group;
            will_list.old_science = will_old.science;
            will_list.old_history = will_old.history;
            will_list.old_contemp = will_old.contemp;
            var old_pass = (list.old_culture <= 0 && list.old_citizen <= 0 && list.old_group <= 0 && list.old_science <= 0 && list.old_history <= 0 && list.old_contemp <= 0 && list.old_total <= 0);
            var will_old_pass = (list.old_culture - will_list.old_culture <= 0 && list.old_citizen - will_list.old_citizen <= 0 && list.old_group - will_list.old_group <= 0 && list.old_science - will_list.old_science <= 0 && list.old_history - will_list.old_history <= 0 && list.old_contemp - will_list.old_contemp <= 0 && list.old_total - will_list.old_total <= 0);

            //general_new
            list.new_total = general_new.require.total - general_new.acquire.total;
            list.new_core_total = general_new.require.core;
            for (var i = 0; i < general_new.course.length; i++) {
                if (general_new.course[i].complete && general_new.course[i].dimension != '') {
                    if (general_new.course[i].dimension.substring(0, 1) === '核') {
                        if (general_new.course[i].dimension.substring(3, 5) === '社會') {
                            list.new_core_society -= general_new.course[i].realCredit;
                            list.new_core_total -= general_new.course[i].realCredit;
                        } else if (general_new.course[i].dimension.substring(3, 5) === '人文') {
                            list.new_core_humanity -= general_new.course[i].realCredit;
                            list.new_core_total -= general_new.course[i].realCredit;
                        }
                    }
                } else {
                    if (general_new.course[i].reason === 'now') {
                        will_list.total += general_new.course[i].originalCredit;
                        will_list.new_total += general_new.course[i].originalCredit;
                        if (general_new.course[i].dimension.substring(0, 1) === '核') {
                            if (general_new.course[i].dimension.substring(3, 5) === '社會') {
                                will_list.new_core_total += general_new.course[i].originalCredit;
                                will_list.new_core_society += general_new.course[i].originalCredit;
                            } else if (general_new.course[i].dimension.substring(3, 5) === '人文') {
                                will_list.new_core_total += general_new.course[i].originalCredit;
                                will_list.new_core_humanity += general_new.course[i].originalCredit;
                            }
                        } else if (general_new.course[i].dimension.substring(0, 1) === '跨') {
                            will_list.new_cross += general_new.course[i].originalCredit;
                        } else if (general_new.course[i].dimension.substring(0, 1) === '校') {
                            will_list.new_cross += general_new.course[i].originalCredit;
                        }
                    }
                }
            }
            list.new_basic = general_new.require.basic - general_new.acquire.basic;
            list.new_cross = general_new.require.cross - general_new.acquire.cross;
            var new_pass = (list.new_total <= 0 && list.new_core_total <= 0 && list.new_core_society <= 0 && list.new_core_humanity <= 0 && list.new_basic <= 0 && list.new_cross <= 0);
            var will_new_pass = (list.new_total + will_list.new_total <= 0 && list.new_core_total + will_list.new_core_total <= 0 && list.new_core_society + will_list.new_core_society <= 0 && list.new_core_humanity + will_list.new_core_humanity <= 0 && list.new_basic + will_list.new_basic <= 0 && list.new_cross + will_list.new_cross <= 0);

            var general_pass = false;
            var will_general_pass = false;
            if (parseInt(studentId.substring(0, 2)) <= 5) {
                if (list.submit_type === 0) {
                    general_pass = old_pass;
                    will_general_pass = will_old_pass;
                } else if (list.submit_type === 1) {
                    general_pass = new_pass;
                    will_general_pass = will_new_pass;
                }
            } else {
                general_pass = new_pass;
                will_general_pass = will_new_pass;
            }

            //lang
            if (info.en_certificate === null) { info.en_certificate = '0'; }
            list.en_status = parseInt(info.en_certificate);
            list.en_total = lang.require - lang.acquire;
            var basic_credit = 0;
            var advanced_credit = 0;
            var second_credit = 0;
            var will_basic = 0;
            var will_advanced = 0;
            var will_second = 0;
            var advanced_num = 0;
            for (var i = 0; i < lang.course.length; i++) {
                if (lang.course[i].complete) {
                    if (lang.course[i].cn.substring(0, 2) === '大一') {
                        basic_credit += lang.course[i].realCredit;
                    } else if (lang.course[i].cn.substring(0, 4) === '進階英文') {
                        advanced_credit += lang.course[i].realCredit;
                        advanced_num++;
                    } else {
                        second_credit += lang.course[i].realCredit;
                    }
                } else {
                    if (lang.course[i].reason === 'now') {
                        if (lang.course[i].cn.substring(0, 2) === '大一') {
                            will_basic += lang.course[i].originalCredit;
                        } else if (lang.course[i].cn.substring(0, 4) === '進階英文') {
                            will_advanced += lang.course[i].originalCredit;
                            advanced_num++;
                        } else {
                            will_second += lang.course[i].originalCredit;
                        }
                    }
                }
            }
            if (list.en_status === 0) {
                list.en_basic = 4 - basic_credit;
                list.en_advanced = 4 - advanced_credit - second_credit;
                list.en_total = 8 - basic_credit - second_credit - advanced_credit;
                will_list.en_basic = list.en_basic - will_basic;
                will_list.en_advanced = list.en_advanced - will_advanced - will_second;
                will_list.en_total = list.en_total - will_basic - will_second - will_advanced;
                list.en_uncertified = 4 - advanced_num;
                if (list.en_uncertified > 2) list.en_uncertified = 2;
            } else if (list.en_status === 2 || list.en_status === 3 || list.en_status === 4) {
                list.en_basic = 4 - basic_credit;
                list.en_advanced = 4 - advanced_credit - second_credit;
                if (list.en_advanced < 0)
                    list.en_basic += list.en_advanced;
                list.en_total = 8 - basic_credit - advanced_credit - second_credit;
                will_list.en_basic = list.en_basic - will_basic;
                will_list.en_advanced = list.en_advanced - will_advanced;
                if (will_list.en_advanced < 0)
                    will_list.en_basic += will_list.en_advanced;
                will_list.en_total = list.en_total - will_basic - will_advanced - will_second;
            } else if (list.en_status === 1) {
                list.en_basic = 0;
                list.en_advanced = 0;
                list.en_total = 0;
            }

            var en_pass = (list.en_total <= 0 && list.en_basic <= 0 && list.en_advanced <= 0);
            var will_en_pass = (will_list.en_total <= 0 && will_list.en_basic <= 0 && will_list.en_advanced <= 0);

            var net_map = { '計算機網': 0, '網路程式': 1, '網路通訊': 2 };
            var media_map = { '計算機圖': 0, '影像處理': 1, '數值方法': 2 };
            var net_course = ['計算機網路概論', '網路程式設計概論', '網路通訊原理'];
            var media_course = ['計算機圖學概論', '影像處理概論', '數值方法'];
            var net_complete = [0, 0, 0];
            var media_complete = [0, 0, 0];
            var net_credit = 9;
            var media_credit = 9;

            for (var i = 0; i < compulse.course.length; i++) {
                if (compulse.course[i].complete) {
                    if (compulse.course[i].cn.substring(0, 4) === '導師時間') {
                        list.mentor -= 1;
                    } else {
                        var cn = compulse.course[i].cn;
                        if (compulse.course[i].english === true && compulse.course[i].code.substring(0, 3) === 'DCP') {
                            list.en_course = 1;
                        }

                        if (cn.substring(0, 7) === '計算機網路概論' || cn.substring(0, 8) === '網路程式設計概論' || cn.substring(0, 6) === '網路通訊原理') {
                            net_credit -= 3;
                            net_complete[net_map[cn.substring(0, 4)]] = 1;
                        } else if (cn.substring(0, 7) === '計算機圖學概論' || cn.substring(0, 6) === '影像處理概論' || cn.substring(0, 4) === '數值方法') {
                            media_credit -= 3;
                            media_complete[media_map[cn.substring(0, 4)]] = 1;
                        }
                    }
                } else {
                    if (compulse.course[i].reason === 'now') {
                        list.current.push(compulse.course[i].cn);
                        if (compulse.course[i].cn.substring(0, 4) === '導師時間') {
                            will_list.mentor += 1;
                        } else {
                            var cn = compulse.course[i].cn;
                            if (compulse.course[i].english === true && compulse.course[i].code.substring(0, 3) === 'DCP') {
                                will_list.en_course = 1;
                            }
                            if (cn.substring(0, 7) === '計算機網路概論' || cn.substring(0, 8) === '網路程式設計概論' || cn.substring(0, 6) === '網路通訊原理') {
                                will_list.net += 3;
                            } else if (cn.substring(0, 7) === '計算機圖學概論' || cn.substring(0, 6) === '影像處理概論' || cn.substring(0, 4) === '數值方法') {
                                will_list.media += 3;
                            }
                        }
                        will_list.compulse += compulse.course[i].originalCredit;
                        will_list.total += compulse.course[i].originalCredit;
                    } else {
                        list.compulse.push(compulse.course[i].cn);
                    }
                }
            }

            for (var i = 0; i < pro.course.length; i++) {
                if (pro.course[i].complete) {
                    var cn = pro.course[i].cn;
                    if (pro.course[i].english === true && pro.course[i].code.substring(0, 3) === 'DCP') {
                        list.en_course = 1;
                    }
                    if (cn.substring(0, 7) === '計算機網路概論' || cn.substring(0, 8) === '網路程式設計概論' || cn.substring(0, 6) === '網路通訊原理') {
                        net_credit -= 3;
                        net_complete[net_map[cn.substring(0, 4)]] = 1;
                    } else if (cn.substring(0, 7) === '計算機圖學概論' || cn.substring(0, 6) === '影像處理概論' || cn.substring(0, 4) === '數值方法') {
                        media_credit -= 3;
                        media_complete[media_map[cn.substring(0, 4)]] = 1;
                    }
                } else {
                    if (pro.course[i].reason === 'now') {
                        var cn = pro.course[i].cn;
                        if (pro.course[i].english === true && pro.course[i].code.substring(0, 3) === 'DCP') {
                            will_list.en_course = 1;
                        }
                        if (cn.substring(0, 7) === '計算機網路概論' || cn.substring(0, 8) === '網路程式設計概論' || cn.substring(0, 6) === '網路通訊原理') {
                            will_list.net += 3;
                        } else if (cn.substring(0, 7) === '計算機圖學概論' || cn.substring(0, 6) === '影像處理概論' || cn.substring(0, 4) === '數值方法') {
                            will_list.media += 3;
                        }
                        will_list.pro += pro.course[i].originalCredit;
                        will_list.total += pro.course[i].originalCredit;
                    }
                }
            }

            for (var i = 0; i < 3; i++) {
                if (net_complete[i] === 1) {
                    list.net.push(net_course[i]);
                }
                if (media_complete[i] === 1) {
                    list.media.push(media_course[i]);
                }
            }

            list.net_credit = net_credit;
            list.media_credit = media_credit;

            for (var i = 0; i < other.course.length; i++) {
                if (!other.course[i].complete && other.course[i].reason === 'now') {
                    will_list.other += other.course[i].originalCredit;
                    will_list.total += other.course[i].originalCredit;
                }
            }

            for (var i = 0; i < pe.course.length; i++) {
                if (!pe.course[i].complete && pe.course[i].reason === 'now') {
                    will_list.pe += 1;
                }
            }

            for (var i = 0; i < service.course.length; i++) {
                if (!service.course[i].complete && service.course[i].reason === 'now') {
                    will_list.service += 1;
                }
            }

            for (var i = 0; i < art.course.length; i++) {
                if (!art.course[i].complete && art.course[i].reason === 'now') {
                    will_list.art += 1;
                }
            }

            list.total_credit = total.acquire;
            var total_pass = list.total_credit >= total.require;
            var will_total_pass = (list.total_credit + will_list.total) >= total.require;

            list.pro = pro.require - pro.acquire;
            var pro_pass = list.pro <= 0;
            var will_pro_pass = (list.pro - will_list.pro) <= 0;

            list.other = other.require - other.acquire;
            var other_pass = list.other <= 0;
            var will_other_pass = (list.other - will_list.other) <= 0;

            list.pe = pe.require - pe.acquire;
            var pe_pass = list.pe <= 0;
            var will_pe_pass = (list.pe - will_list.pe) <= 0;

            list.service = service.require - service.acquire;
            var service_pass = list.service <= 0;
            var will_service_pass = (list.service - will_list.service) <= 0;

            list.art = art.require - art.acquire;
            var art_pass = list.art <= 0;
            var will_art_pass = (list.art - will_list.art) <= 0;

            var mentor_pass = list.mentor <= 0;
            var will_mentor_pass = (list.mentor - will_list.mentor) <= 0;

            var net_media_pass = (net_credit <= 0 || media_credit <= 0);
            var will_net_media_pass = (list.net - will_list.net <= 0 || list.media - will_list.media <= 0);

            var eng_pass = list.en_course === 1;
            var will_eng_pass = (list.en_course == 1) || (will_list.en_course == 1);

            var compulse_pass = (compulse.require - compulse.acquire) <= 0;
            var will_compulse_pass = (compulse.require - compulse.acquire - will_list.compulse) <= 0;

            var no_compulse_current = list.current.length <= 0;

            var pass = (total_pass && compulse_pass && pro_pass && other_pass && general_pass && en_pass && pe_pass && service_pass && art_pass && mentor_pass && eng_pass && no_compulse_current);

            var will_pass = (will_total_pass && will_compulse_pass && will_pro_pass && will_other_pass && will_general_pass && will_en_pass && will_pe_pass && will_service_pass && will_art_pass && will_mentor_pass && will_eng_pass);

            if (pass) {
                list.graduate_status = 2;
            } else if (will_pass) {
                list.graduate_status = 1;
            } else {
                list.graduate_status = 0;
            }

            list.pro = Math.max(0, list.pro - will_list.pro);
            list.other = Math.max(0, list.other - will_list.other);
            list.old_total = Math.max(0, list.old_total - will_list.old_total);
            list.old_contemp = Math.max(0, list.old_contemp - will_list.old_contemp);
            list.old_culture = Math.max(0, list.old_culture - will_list.old_culture);
            list.old_history = Math.max(0, list.old_history - will_list.old_history);
            list.old_citizen = Math.max(0, list.old_citizen - will_list.old_citizen);
            list.old_group = Math.max(0, list.old_group - will_list.old_group);
            list.old_science = Math.max(0, list.old_science - will_list.old_science);
            list.new_total = Math.max(0, list.new_total - will_list.new_total);
            list.new_core_total = Math.max(0, list.new_core_total - will_list.new_core_total);
            list.new_core_society = Math.max(0, list.new_core_society - will_list.new_core_society);
            list.new_core_humanity = Math.max(0, list.new_core_humanity - will_list.new_core_humanity);
            list.new_basic = Math.max(0, list.new_basic - will_list.new_basic);
            list.new_cross = Math.max(0, list.new_cross - will_list.new_cross);
            list.en_total = Math.max(0, will_list.en_total);
            list.en_basic = Math.max(0, will_list.en_basic);
            list.en_advanced = Math.max(0, will_list.en_advanced);
            list.en_uncertified = Math.max(0, list.en_uncertified);
            list.pe = Math.max(0, list.pe - will_list.pe);
            list.service = Math.max(0, list.service - will_list.service);
            list.art = Math.max(0, list.art - will_list.art);
            list.mentor = Math.max(0, list.mentor - will_list.mentor);

            setTimeout(function() {
                query.CreateStudentGraduate(list, function(err, result2) {
                    if (err) {
                        throw err;
                        res.redirect('/');
                    } else if (!result2) {
                        res.redirect('/');
                    } else {
                        result2 = JSON.parse(result2);
                        req.studentListUpdate = result2;
                        if (req.studentListUpdate)
                            next();
                        else
                            return;
                    }
                });
            }, 1000);
        }
    });
}

// --------------------------------------------------------------------graduate table

// advisee table---------------------------------------------------------------------

/* 列出所有教授的資訊 */
table.adviseeTeacherList = function(req, res, next) {
    if (req.session.profile) {
        query.ShowTeacherIdList(function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                result = JSON.parse(result);
                var list = [];
                for (var i = 0; i < result.length; i++) {
                    var info = {
                        id: result[i].teacher_id,
                        name: result[i].tname,
                        status: 0,
                        email: result[i].email,
                        all_students: parseInt(result[i].all_students),
                        recent_failed: parseInt(result[i].recent_failed),
                        failed_students: parseInt(result[i].failed_students)
                    }
                    if (info.id == "T9303")
                        info.status = 1;
                    list.push(info);
                }
                if (list.length == result.length) {
                    req.teacherList = list;
                    if (req.teacherList)
                        next();
                    else
                        return;
                }
            }
        });
    } else
        res.redirect('/');
}

/* 列出該教授的所有導生的資訊 */
table.adviseeStudentList = function(req, res, next) {
    if (req.session.profile) {
        var teacherId = req.body.teacher_id;
        query.ShowTeacherMentors(teacherId, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                var info = [];
                result = JSON.parse(result);
                for (var i = 0; i < result.length; i++) {
                    query.ShowUserInfo(result[i].student_id, function(err, profile) {
                        if (err) {
                            throw err;
                            res.redirect('/');
                        }
                        if (!profile) {
                            res.redirect('/');
                        } else {
                            profile = JSON.parse(profile);
                            profile = {
                                student_id: profile[0].student_id,
                                sname: profile[0].sname,
                                program: profile[0].program,
                                graduate: profile[0].graduate,
                                graduate_submit: profile[0].graduate_submit,
                                email: profile[0].email,
                                recent_failed: (profile[0].recent_failed == "true") ? true : false,
                                failed: (profile[0].failed == "failed") ? true : false
                            }
                            info.push(profile);
                        }
                        if (info.length == result.length) {
                            req.studentList = info;
                            if (req.studentList)
                                next();
                            else
                                return;
                        }
                    });
                }
            }
        });
    } else
        res.redirect('/');
}

/* 列出該學生每學期平均,有無被21,各科成績 */
table.adviseeSemesterScoreList = function(req, res, next) {
    if (req.session.profile) {
        var input = req.body.student_id;
        query.ShowSemesterScore(input, function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            else {
                result = JSON.parse(result);
                var list = [];
                for (var i = 0; i < result.length; i++) {
                    var grade = {
                        semester: result[i].semester,
                        failed: result[i].failed == 'false' ? false : true,
                        avg: parseInt(result[i].avg),
                        credit: parseInt(result[i].credit),
                        score: []
                    };
                    for (var j = 0; j < result[i].score.length; j++) {
                        var scoreObj = {
                            cn: result[i].score[j].cn,
                            en: result[i].score[j].en,
                            score: (parseInt(result[i].score[j].score) > 0) ? parseInt(result[i].score[j].score) : null,
                            pass: result[i].score[j].pass == '通過' ? true : ((result[i].score[j].pass == 'W') ? 'W' : false)
                        }
                        grade.score.push(scoreObj);
                    }
                    if (grade.score.length == result[i].score.length)
                        list.push(grade);
                }
                if (list.length == result.length) {
                    req.scoreList = list;
                    if (req.scoreList)
                        next();
                    else
                        return;
                }
            }
        });
    } else
        res.redirect('/');
}

// ---------------------------------------------------------------------advisee table


exports.table = table;
