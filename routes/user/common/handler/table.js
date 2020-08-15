var table = {};
var fs= require('fs');
var Readable = require('stream').Readable;
var nodemailer = require('nodemailer');
var query = require('../../../../db/msql');
var data_path = "/home/nctuca/dinodino-extension/automation/data";
var sample_path = "/home/nctuca/dinodino-extension/automation/sample";
var XLSX = require('xlsx')

table.mailSend = (req, res, next) => {
	let promiseShowUserInfo = (id) => new Promise((resolve, reject) => {
		query.ShowUserInfo(id, (error, result) => {
			if(error) reject('Cannot fetch ShowUserInfo. Error message: ' + error);
			if(!result) reject('Cannot fetch ShowUserInfo.');
			else resolve(JSON.parse(result));
		});
	});

	let promiseSendMail = (options) => new Promise((resolve, reject) => {
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: require('../../../auth/nctu/mail_info').auth
        });

        transporter.sendMail(options, (error, info) => {
			if(error) reject('Cannot send mail. Error message: ' + error);
        	else resolve();
		});
	});

	Promise.all([
		Promise.all(req.body.to.map(id => promiseShowUserInfo(id))),
		Promise.all(req.body.cc.map(id => promiseShowUserInfo(id))),
		Promise.all(req.body.bcc.map(id => promiseShowUserInfo(id)))
	])
	.then(([to, cc, bcc]) => [to.map(r => r.email), cc.map(r => r.email), bcc.map(r => r.email)])
	.then(([toMails, ccMails, bccMails]) => {
        let options = {
            from:		'nctucsca@gmail.com',
            to:			toMails.join(),
            cc:			ccMails.join(),
            bcc:		bccMails.join(),
            subject:	req.body.subject, // Subject line
            html:		req.body.content
        };

		return promiseSendMail(options);
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
};


/*
table.mailSend = function(req, res, next){
    if(req.session.profile){
        
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: require('../../../auth/nctu/mail_info').auth
        });
        
        var options = {
            //寄件者
            from: 'nctucsca@gmail.com',
            //收件者
            to: req.body.receiver_email, 
            //副本
            cc: req.body.sender_email,
            //密件副本
            bcc: '',
            //主旨
            subject: req.body.title, // Subject line
            //純文字
            /*text: 'Hello world2', // plaintext body
            //嵌入 html 的內文
            html: '<p>此信件由系統自動發送，請勿直接回信！若有任何疑問，請聯絡：' + req.body.name +' () 先生/小姐 '+ req.body.sender_email +'謝謝。</p><p>This message is automatically sent by e3 system, please do not reply directly! If you have any questions, please contact with Mr/Ms. '+ req.body.name +'()'+req.body.sender_email+'.</p><p>- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</p><p>'+req.body.content+'</p>'
            //附件檔案
            /*attachments: [ {
                filename: 'text01.txt',
                content: '聯候家上去工的調她者壓工，我笑它外有現，血有到同，民由快的重觀在保導然安作但。護見中城備長結現給都看面家銷先然非會生東一無中；內他的下來最書的從人聲觀說的用去生我，生節他活古視心放十壓心急我我們朋吃，毒素一要溫市歷很爾的房用聽調就層樹院少了紀苦客查標地主務所轉，職計急印形。團著先參那害沒造下至算活現興質美是為使！色社影；得良灣......克卻人過朋天點招？不族落過空出著樣家男，去細大如心發有出離問歡馬找事'
            }]
        };
        
        transporter.sendMail(options, function(err, info){
            if(err){
                throw err;
            }
        });
//         var mailContent = {sender_id : req.body.sender_id , title :req.body.title, receiver_id: req.body.receiver_id, content: req.body.content};
//       query.CreateMail(mailContent);

         var signal = {signal:1};
         req.signal = signal;
         if(req.signal)
            	next();
        	else
            	return;
    }
    else
      res.redirect('/');
}
*/
table.mailSent = function(req, res, next){
    if(req.session.profile){ 
        query.ShowMailSendList(req.body.id, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
            	result = JSON.parse(result);
            	req.sent = result;
        		if(req.sent)
            		next();
        		else
            		return;
            }
        });
   }
    else
        res.redirect('/');
}

table.mailInbox = function(req, res, next){
    if(req.session.profile){     
        query.ShowMailRcdList(req.body.id, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
            	result = JSON.parse(result);
            	req.inbox = result;
        		if(req.inbox)
            		next();
        		else
            		return;
            }
        });    
    }
    else
         res.redirect('/');
}

table.mailInfo = function(req, res, next){
    if(req.session.profile){     
        query.ShowMailInfo(req.body.mail_id, function(err, result){
            if(err){
                throw err;
                res.redirect('/');
            }
            if(!result)
                res.redirect('/');
            else{
            	result = JSON.parse(result);
            	req.info = result;
        		if(req.info)
            		next();
        		else
            		return;
            }
        });    
    }
    else
         res.redirect('/');
}

table.bulletinShow = function(req, res, next){
    if(req.session.profile){
        query.ShowAllBulletinMsg(function(err, result){
            if(err) {
                throw err;
                res.redirect('/')
            }
            if(!result.length){
                res.send("bulletin empty!")
            }
            else{
                var bulletin = []
                result = JSON.parse(result)
                var i
                for(i = 0; i < result.length; ++i){
                    var data = {
                        "id": result[i].unique_id,
                        "type": parseInt(result[i].cont_type),
                        "content": result[i].content,
                        "link": result[i].link,
                        "timestamp": result[i].create_time
                    }
                    bulletin.push(data)
                }
                bulletin.sort((a, b) => (Date.parse(a.timestamp) < Date.parse(b.timestamp)) ? 1 : -1);
                req.bulletin = bulletin
                next();
            }
        })
    }
    else
        res.redirect('/')
}

table.bulletinCreate = function(req, res, next){
    if(req.session.profile){
        var bulletin = {
            cont_type: req.body.type,
            content: req.body.content
        }
        if(req.body.link === undefined || req.body.link === null);
        else bulletin["link"] = req.body.link
        query.CreateBulletinMsg(bulletin, function(err, result){
            if(err) {
                req.signal = 403
                throw err
            }
            if(!result){
                req.signal = 403
                next()
            }
            else{
                req.signal = 204
                next()
            }
        })
    }
    else{
        res.redirect('/')
    }
}

table.bulletinEdit = function(req, res, next){
    if(req.session.profile){
        var bulletin = {
            msg_idx: req.body.id,
            cont_type: req.body.type,
            content: req.body.content,
            link: (req.body.link === undefined || req.body.link === null) ? "" : req.body.link
        }
        query.SetBulletinMsg(bulletin, function(err, result){
            if(err) {
                req.signal = 403
                throw err
            }
            if(!result){
                req.signal = 403
                next()
            }
            else{
                req.signal = 204
                next()
            }
        })
    }
    else{
        res.redirect('/')
    }
}

table.bulletinDelete = function(req, res, next){
    if(req.session.profile){
        var bulletin = {
            msg_idx: req.body.id,
        }
        query.DeleteBulletinMsg(bulletin, function(err, result){
            if(err) {
                req.signal = 403
                throw err
            }
            if(!result){
                req.signal = 403
                next()
            }
            else{
                req.signal = 204
                next()
            }
        })
    }
    else{
        res.redirect('/')
    }
}

table.dataFormDownload = function(req, res, next){
    if(req.session.profile){
        var fileName = req.body.data_type;
        fs.readFile(sample_path + '/' + fileName + '範例.xlsx', function(err, result){
            req.download = result.toString('base64');
            if (req.download)
                next();
            else
                return;
        });
    }
    else
        res.redirect('/');
}

table.dataUpload = function(req, res, next) {
    if (req.session.profile) {
        var input = req.body;
        const buffer = Buffer.from(input.file_data, 'base64');
        var readStream = new Readable();
        var fileName = '';
        if (input.data_type == '專題選課名單') {
            fileName = input.data_type + '.xlsx';
        } else {
            var now = new Date();
            var date = now.toLocaleString().split(" ")[0];
            var time = now.toLocaleString().split(" ")[1];
            fileName = input.data_type + '_' + date + '_' + time + '.xlsx';
        }

        let promiseResearchOnCos = (type) => new Promise((resolve, reject) => {
            if (type == '專題選課名單') {
                var semester = input.semester;
                var first_second = input.first_second;

                const workbook = XLSX.readFile(data_path + '/' + fileName);
                const sheetNames = workbook.SheetNames;
                const worksheet = workbook.Sheets[sheetNames[0]];
                const json_result = XLSX.utils.sheet_to_json(worksheet)
                var student_ids = json_result.map(item => Object.values(item)[0]);
                const new_worksheet_data = [
                    ['學號', '學期', '專題一或二']
                ]
                if (student_ids.length == 0) {
                    new_worksheet_data.push(['空', semester, parseInt(first_second)])
                } else {
                    student_ids.forEach(id => {
                        new_worksheet_data.push([id, semester, parseInt(first_second)])
                    })
                }
                const new_worksheet = XLSX.utils.aoa_to_sheet(new_worksheet_data)
                let new_workbook = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(new_workbook, new_worksheet, 'SheetJS')
                XLSX.writeFile(new_workbook, data_path + '/' + fileName)
            }
            resolve()
        });

        var writeStream = fs.createWriteStream(data_path + '/' + fileName);
        readStream.push(buffer);
        readStream.push(null);
        readStream.pipe(writeStream);
        writeStream.on('finish', function(err) {
            if (err) {
                throw err;
                res.redirect('/');
            } else {
                promiseResearchOnCos(input.data_type)
                    .then(() => {
                        query.InsertNewData({ file_name: fileName, data_type: input.data_type, semester: input.semester });
                    })
                    .then(() => {
                        req.signal = { signal: 1 };
                        next()
                    })
            }
        });
    } else
        res.redirect('/');
}

/*table.dataUpload = function(req, res, next){
    if(req.session.profile){
        var input = req.body;
        const buffer = Buffer.from(input.file_data, 'base64');
        var readStream = new Readable();
        var fileName = '';
		if(input.data_type == '專題選課名單'){
			fileName = input.semester + '-' + input.data_type;
		}
		else{
			var now = new Date();
			var date = now.toLocaleString().split(" ")[0];
			var time = now.toLocaleString().split(" ")[1];
			fileName = input.data_type + '_' + date + '_' + time + '.xlsx';
		}
        var writeStream = fs.createWriteStream(data_path + '/' + fileName);
        readStream.push(buffer);
        readStream.push(null);
        readStream.pipe(writeStream);
        writeStream.on('finish', function(err) {
            if(err) {
                throw err;
                res.redirect('/');
            }
            else{
                query.InsertNewData({file_name: fileName, data_type: input.data_type, semester: input.semester});
                setTimeout(function(){
                    req.signal = {signal :1};
                    if(req.signal)
                        next();
                    else
                        return;
                },1000);
            }
        });
    }
    else
        res.redirect('/');
}*/

table.dataLogShow = function(req, res, next){
    if(req.session.profile){
        query.ShowAllDataLog(function(err, result){
            if(err) {
                throw err;
                res.redirect('/');
            }
            else{
                var dataLog = [];
                result = JSON.parse(result);
                for(var i = 0; i < result.length; ++i){
                    var log = {
                        "id": result[i].unique_id,
                        "time": result[i].time,
                        "status": result[i].status,
                        "message": result[i].message,
                        "data_type": result[i].data_type,
                        "year": result[i].year,
                        "semester": result[i].semester
                    }
                    dataLog.push(log);
                }
                req.dataLog = dataLog;
                next();
            }
        })
    }
    else
        res.redirect('/');
}

table.dataLogDelete = function(req, res, next){
    if(req.session.profile){
        query.DeleteDataLog({id: req.body.id}, function(err, result){
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result);
            var signal = {
                signal: (parseInt(result.info.affectedRows) > 0)?1:0
            }
            req.signal = signal;
            if (req.signal)
                next();
            else
                return;
        })
    }
    else
        res.redirect('/')
}

table.dataLogDeleteAll = function(req, res, next){
    if(req.session.profile){
        query.DeleteAllDataLog(function(err, result){
            if (err) {
                throw err;
                res.redirect('/');
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result);
            var signal = {
                signal: (parseInt(result.info.affectedRows) > 0)?1:0
            }
            req.signal = signal;
            if (req.signal)
                next();
            else
                return;
        })
    }
    else
        res.redirect('/')
}

// other table-----------------------------------------------------------------------

/*table.createApplyPeriod = function(req, res, next){
    if (req.session.profile) {
        var input = req.body; 
        var info = {semester: '', type:'', begin:'', end: ''};
        info.semester = input.semester;
        if(input.hasOwnProperty('graduation')) {
            info.type = 'graduation';
            info.begin = input.graduation.begin;
            info.end = input.graduation.end;
        }
        else if(input.hasOwnProperty('project')) {
            info.type = 'research';
            info.begin = input.project.begin;
            info.end = input.project.end;
        }
        else if(input.hasOwnProperty('verify')) {
            info.type = 'offset';
            info.begin = input.verify.begin;
            info.end = input.verify.end;
        }
    	query.CreateApplyPeriod(info, function(err, result) {
            if(err) {
                req.signal = 403
                throw err
            }
            if(!result){
                req.signal = 403
                next()
            }
            else{
                req.signal = 204
                next()
            }
        });
    }
    else
        res.redirect('/');
}*/

table.setApplyPeriod = function(req, res, next){
    if (req.session.profile) {
        var input = req.body; 
        var info = {type:'', begin:'', end: ''};
        if(input.hasOwnProperty('graduation')) {
            info.type = 'graduation';
            info.begin = input.graduation.begin;
            info.end = input.graduation.end;
        }
        else if(input.hasOwnProperty('project')) {
            info.type = 'research';
            info.begin = input.project.begin;
            info.end = input.project.end;
        }
        else if(input.hasOwnProperty('verify')) {
            info.type = 'offset';
            info.begin = input.verify.begin;
            info.end = input.verify.end;
        }
    	query.SetApplyPeriod(info, function(err, result) {
            if(err) {
                req.signal = 403
                throw err
            }
            if(!result){
                req.signal = 403
                next()
            }
            else{
                req.signal = 204
                next()
            }
        });
    }
    else
        res.redirect('/');
}

table.showApplyPeriod = function(req, res, next){
    if(req.session.profile) {
        //var input = req.body;
        //var input = {semester: '108-1'};
        query.ShowApplyPeriod(function(err, result) {
            if (err) {
                throw err;
                res.redirect('/');    
            }
            if (!result)
                res.redirect('/');
            result = JSON.parse(result);
            var output = {
              "verify": {
                "begin": "",
                "end": ""
              },
              "project": {
                "begin": "",
                "end": ""
              },
              "graduation": {
                "begin": "",
                "end": ""
              }
            };
            output.verify.begin = result.offset.begin;
            output.verify.end = result.offset.end;
            output.project.begin = result.research.begin;
            output.project.end = result.research.end;
            output.graduation.begin = result.graduation.begin;
            output.graduation.end = result.graduation.end;
            req.showApplyPeriod = output;
			if (req.showApplyPeriod)
				next();
			else
				return;
        });
    }
    else
        res.redirect('/');

}
// ------------------------------------------------------------------------other table

exports.table = table;
