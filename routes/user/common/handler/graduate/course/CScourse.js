var utils = require('../../../../../../utils');
var CScourse = {};

CScourse.processCS = function(req, res, next) {

	var courseResult = res.locals.courseResult;
	var notCS = res.locals.notCS;
	var EnglishCourse = res.locals.English;
	var free = res.locals.free;
	var offset = JSON.parse(req.free);
	//console.log(offset);
	var PCB = {
		physic: [],
		chemistry: [],
		biology: []
	}
	var taken = [];
	var detail = [];
	var trueCounter;
	var cosNumber;
	if (req.session.profile) {
		var studentId = res.locals.studentId;
		var TeacherTime = res.locals.teacher;
		var offsetTeacherTime = res.locals.offsetTeacher;
		//console.log(offsetTeacherTime);
		var TeacherSame = [];
		var temp = parseInt(studentId.substring(1, 2));
		var school_year = (100 + temp);
		var program = req.profile[0].program;
		var Tcount = 0;
		var sameCount = 0;
		if (!studentId) {
			//console.log("No Student Id");
			return;
		}
		var pass = JSON.parse(req.pass);
		//console.log(pass);
		var rules = JSON.parse(req.rules);
		//language.require = 8;
		for (var i = 0; i < pass.length; i++) {
			if (pass[i].cos_cname.includes('導師時間')) {
				//console.log(pass[i]);

				if (taken[pass[i].cos_code] == true) {
					sameCount++;
					var changeCode = pass[i].cos_code + '_' + sameCount;
					taken[changeCode] = true;
					detail[changeCode] = pass[i];
					////console.log("temp"+changeCode);
					////console.log("sane count"+sameCount);

				} else {
					taken[pass[i].cos_code] = true;
					detail[pass[i].cos_code] = pass[i];
				}
			} else {
				if (taken[pass[i].cos_code] == true) {
					if (pass[i].pass_fail == '通過') {
						if (detail[pass[i].cos_code].pass_fail == '通過') {
							if (parseInt(pass[i].score) > parseInt(detail[pass[i].cos_code].score))
								detail[pass[i].cos_code] = pass[i];
						} else
							detail[pass[i].cos_code] = pass[i];
					}
				} else {
					detail[pass[i].cos_code] = pass[i];
					taken[pass[i].cos_code] = true;
				}
			}
		}
		// determine compulsory courses
		var compulse = req.course.compulse;
		//console.log(compulse);
		var teacherCount = 0;
		var PCBnum = [];
		var offsetNameCheck = [];
		var offsetCodeCheck = [];
		for (i = 0; i < offset.length; i++) {
			offsetNameCheck[offset[i].cos_cname] = true;
			offsetCodeCheck[offset[i].cos_code] = true;
		}
		for (var q = 0; q < compulse.length; q++) {
			if (compulse[q].cos_cname.includes('導師時間')) {
				for (var t = 0; t < TeacherTime.length; t++) {
					////console.log("in inside teacher");
					////console.log(TeacherTime[t]);
					var cosInfo = JSON.stringify(TeacherTime[t]);
					cosInfo = JSON.parse(cosInfo);
					cosInfo.realCredit = 0;
					cosInfo.reason = 'notCS';
					//console.log(cosInfo);
					courseResult[0].course.push(cosInfo);
					Tcount++;
				}
				for (var t = 0; t < offsetTeacherTime.length; t++)
					Tcount++;
				var codeCheck = true;
				for (var code_i = 0; code_i < compulse[q].cos_codes.length; code_i++) {
					if (!offsetCodeCheck[compulse[q].cos_codes[code_i]]) {
						codeCheck = false;
					}
				}
				if (offsetNameCheck[compulse[q].cos_cname] == true && codeCheck);
				else if (Tcount != 2){
                    //console.log(compulse[q].cos_cname + " " + codeCheck);
					cosNumber = compulse[q].cos_codes;
					for (var k = 0; k < cosNumber.length; k++) {
						var cosInfo = {
							cn: '',
							en: '',
							score: '',
							code: '',
							realCredit: '',
							originalCredit: '',
							type: '必修',
							complete: '',
							grade: null,
							english: false,
							year: '',
							semester: '',
							reason: 'CS',
							move: false
						};
						cosInfo.cn = compulse[q].cos_cname;
						cosInfo.en = compulse[q].cos_ename;

						if (taken[cosNumber[k]] === true) {
							for (var w = 0; w < 3; w++) {
								var cosInfo = {
									cn: '',
									en: '',
									score: '',
									realCredit: 0,
									originalCredit: 0,
									type: '必修',
									complete: '',
									grade: null,
									english: false,
									year: '',
									semester: '',
									reason: 'CS',
									move: false
								};
								if (w != 0)
									cosNumber[k] = cosNumber[k] + '_' + w;
								if (taken[cosNumber[k]] === true && !offsetCodeCheck[cosNumber[k]]) {
									if (detail[cosNumber[k]].pass_fail == '通過') {
										cosInfo.cn = compulse[q].cos_cname;
										cosInfo.en = compulse[q].cos_ename;
										cosInfo.complete = true;
										cosInfo.score = parseInt(detail[cosNumber[k]].score);
										cosInfo.realCredit = parseFloat(detail[cosNumber[k]].cos_credit);
										cosInfo.code = detail[cosNumber[k]].cos_code + '_' + Tcount;
										cosInfo.year = parseInt(detail[cosNumber[k]].cos_year) - school_year + 1;
										cosInfo.semester = parseInt(detail[cosNumber[k]].semester);
										cosInfo.originalCredit = parseFloat(detail[cosNumber[k]].cos_credit);
										cosInfo.type = detail[cosNumber[k]].cos_type;
										courseResult[0].course.push(cosInfo);
										courseResult[0].credit += parseFloat(detail[cosNumber[k]].cos_credit);
										Tcount++;
										//console.log(Tcount);
										//console.log(cosInfo);
									}
								}
							}
						}
					}
				}
				for (var w = 0; w < (2 - Tcount); w++) {
					var cosInfo = {
						cn: '',
						en: '',
						score: '',
						code: '',
						realCredit: '',
						originalCredit: 0,
						type: '必修',
						complete: false,
						grade: null,
						english: false,
						year: '',
						semester: '',
						reason: 'CS',
						move: false
					};
					cosInfo.cn = compulse[q].cos_cname;
					cosInfo.en = compulse[q].cos_ename;
					courseResult[0].course.push(cosInfo);
				}
				continue;
			}
			trueCounter = 0;
			var more = [];
			cosNumber = compulse[q].cos_codes;
			if (notCS[compulse[q].cos_cname] === true) {
				//free[compulse[q].cos_cname].reason = 'notCS';
				free[compulse[q].cos_cname].complete = true;
				var cosInfo = JSON.stringify(free[compulse[q].cos_cname]);
				cosInfo = JSON.parse(cosInfo);
				cosInfo.reason = 'notCS';
				cosInfo.realCredit = 0;
				courseResult[0].course.push(cosInfo);
			} else if (offsetNameCheck[compulse[q].cos_cname] == true || offsetNameCheck[compulse[q].cos_cname + "(英文授課)"] == true);
			else {
				for (var k = 0; k < cosNumber.length; k++) {
					var cosInfo = {
						cn: '',
						en: '',
						score: '',
						code: '',
						realCredit: 0,
						originalCredit: '',
						type: '',
						complete: '0',
						grade: null,
						english: false,
						year: '',
						semester: '',
						reason: 'CS',
						move: false
					};
					cosInfo.cn = compulse[q].cos_cname;
					cosInfo.en = compulse[q].cos_ename;

					if (taken[cosNumber[k]] === true) {
						cosInfo.code = cosNumber[k];
						cosInfo.year = parseInt(detail[cosNumber[k]].cos_year) - school_year + 1;
						cosInfo.semester = parseInt(detail[cosNumber[k]].semester);
						cosInfo.originalCredit = parseFloat(detail[cosNumber[k]].cos_credit);
						cosInfo.type = detail[cosNumber[k]].cos_type;
						var reg = detail[cosNumber[k]].cos_cname.substring(0, 2);
						var reg2 = compulse[q].cos_cname.substring(0, 3);
						trueCounter++;
						if (detail[cosNumber[k]].pass_fail == '通過') {
							cosInfo.realCredit = parseFloat(detail[cosNumber[k]].cos_credit);
							cosInfo.complete = true;
							cosInfo.score = parseInt(detail[cosNumber[k]].score);
							cosInfo.grade = detail[cosNumber[k]].score_level;
							if (reg2 == '物化生') {
								PCBnum.push(cosNumber[k]);
							}
						} else {
							if (reg2 != '物化生')
								cosInfo.complete = false;
							else
								PCBnum.push(cosNumber[k]);
						}
						reg = compulse[q].cos_cname.substring(0, 3);
						if (reg != '物化生') {
							more.push(cosInfo);
						}
					}
				}
				if (trueCounter == 0) {
					//var checkCount = 0;
					if (offsetNameCheck[cosInfo.cn] != true) {
						var checkCount = 0;
						for (var w = 0; w < cosNumber.length; w++) {
							if (offsetCodeCheck[cosNumber[w]] === true) {
								//console.log("match in revise");
								//console.log(cosInfo); 
								break;
							}
							checkCount++;

						}
						if (checkCount == cosNumber.length) {
							reg = cosInfo.cn.substring(0, 3);
							if (reg != '物化生') {
								cosInfo.complete = false;
								courseResult[0].course.push(cosInfo);
							} else {
								if ((offsetNameCheck['物理(一)'] != true) && (offsetNameCheck['物理(二)'] != true) && (offsetNameCheck['化學(一)'] != true) && (offsetNameCheck['化學(二)'] != true) && (offsetNameCheck['生物(一)'] != true) && (offsetNameCheck['生物(二)'] != true)) {
									cosInfo.code = cosNumber[0];
									cosInfo.complete = false;
									courseResult[0].course.push(cosInfo);
								}
							}
						}
					}

				} else if (more.length >= 1) {
					//console.log("more");
					//console.log(more);
					var max = 0;
					var credit;
					var index = 0;
					var code;
					if (more.length == 1) {
						if (more[0].complete == true) {
							code = more[0].code;
							credit = parseFloat(detail[more[0].code].cos_credit);
							// courseResult[0].credit += credit;
							if (detail[code].cos_typeext == '英文授課') {
								if ((more[0].cn != '基礎程式設計') && (detail[code].cos_cname != '跨領域專題(一)') && (detail[code].cos_cname != '資訊工程專題(一)(英文授課)') && (detail[code].cos_cname != '資訊工程專題(二)(英文授課)') && (detail[code].cos_cname != '資訊工程研討(英文授課)') && (detail[code].cos_cname != '資訊工程研討')) {
									if (code.substring(0, 3) == 'DCP') {
										more[0].english = true;
										EnglishCourse.push(more[0]);
									}
								}
							}
							//console.log("temp:");
							//console.log(temp);
							if (more[0].cn == '微處理機系統實驗') {
								if (temp > 3) {
									var cosAdd = JSON.stringify(more[0]);
									cosAdd = JSON.parse(cosAdd);
									cosAdd.realCredit = 1;
									cosAdd.code = more[0].code + '_one';
									more[0].realCredit = 2;
									if (courseResult[1].credit < courseResult[1].require) {
										courseResult[1].credit += cosAdd.realCredit;
										courseResult[1].course.push(cosAdd);
									} else {
										courseResult[2].credit += cosAdd.realCredit;
										courseResult[2].course.push(cosAdd);
									}
									courseResult[0].credit += more[0].realCredit;
									courseResult[0].course.push(more[0]);
								} else {
									courseResult[0].credit += credit;
									courseResult[0].course.push(more[0]);
								}
							} else if (more[0].cn == '數位電路實驗') {
								if (temp > 3 && credit > 2) {
									var cosAdd = JSON.stringify(more[0]);
									cosAdd = JSON.parse(cosAdd);
									cosAdd.realCredit = 1;
									cosAdd.code = more[0].code + '_one';
									more[0].realCredit = 2;
									if (courseResult[1].credit < courseResult[1].require) {
										courseResult[1].credit += cosAdd.realCredit;
										courseResult[1].course.push(cosAdd);
									} else {
										courseResult[2].credit += cosAdd.realCredit;
										courseResult[2].course.push(cosAdd);
									}
									courseResult[0].credit += more[0].realCredit;
									courseResult[0].course.push(more[0]);
								} else {
									courseResult[0].credit += credit;
									courseResult[0].course.push(more[0]);
								}
							} else {
								courseResult[0].credit += credit;
								courseResult[0].course.push(more[0]);
							}
						} else
							courseResult[0].course.push(more[0]);
					} else {
						for (var d = 0; d < more.length; d++) {
							credit = parseFloat(detail[more[d].code].cos_credit);
							if (more[d].complete == true) {
								if (more[d].score >= max) {
									index = d;
									max = more[d].score;
								}
							}
						}

						code = more[index].code;
						if (more[index].complete == true) {
							//courseResult[0].credit += credit;
							if (detail[code].cos_typeext == '英文授課') {
								if ((more[index].cn != '基礎程式設計') && (detail[code].cos_cname != '跨領域專題(一)') && (detail[code].cos_cname != '資訊工程專題(一)(英文授課)') && (detail[code].cos_cname != '資訊工程專題(二)(英文授課)') && (detail[code].cos_cname != '資訊工程研討(英文授課)') && (detail[code].cos_cname != '資訊工程研討')) {
									if (code.substring(0, 3) == 'DCP') {
										more[index].english = true;
										EnglishCourse.push(more[index]);
									}
								}
							}
							if (more[index].cn == '微處理機系統實驗') {
								if (temp > 3) {
									var cosAdd = JSON.stringify(more[index]);
									cosAdd = JSON.parse(cosAdd);
									cosAdd.realCredit = 1;
									cosAdd.code = more[index].code + '_one';
									more[index].realCredit = 2;
									if (courseResult[1].credit < courseResult[1].require) {
										courseResult[1].credit += cosAdd.realCredit;
										courseResult[1].course.push(cosAdd);
									} else {
										courseResult[2].credit += cosAdd.realCredit;
										courseResult[2].course.push(cosAdd);
									}
									courseResult[0].credit += more[index].realCredit;
									courseResult[0].course.push(more[index]);
								} else {
									courseResult[0].credit += credit;
									courseResult[0].course.push(more[index]);
								}
							} else if (more[index].cn == '數位電路實驗') {
								if (temp > 3 && credit > 2) {
									var cosAdd = JSON.stringify(more[index]);
									cosAdd = JSON.parse(cosAdd);
									cosAdd.realCredit = 1;
									cosAdd.code = more[index].code + '_one';
									more[index].realCredit = 2;
									if (courseResult[1].credit < courseResult[1].require) {
										courseResult[1].credit += cosAdd.realCredit;
										courseResult[1].course.push(cosAdd);
									} else {
										courseResult[2].credit += cosAdd.realCredit;
										courseResult[2].course.push(cosAdd);
									}
									courseResult[0].credit += more[index].realCredit;
									courseResult[0].course.push(more[index]);
								} else {
									courseResult[0].credit += credit;
									courseResult[0].course.push(more[index]);
								}
							} else {
								courseResult[0].credit += credit;
								courseResult[0].course.push(more[index]);
							}
						} else
							courseResult[0].course.push(more[index]);
					}
				}
			}
			////console.log(teacherCount);
			/*if(teacherCount < 1)
			    if(compulse[q].cos_cname == '導師時間'){
			        ////console.log(q);
			        q--;
			        ////console.log(q);
			        teacherCount++;
			    }*/
		}
		//determine PCB to put in compulse or professional

		for(let i = 0; i < PCBnum.length; i++){
			let course = detail[PCBnum[i]];
			if(course.pass_fail != '通過')
				continue;
			let PCB_cos = {
				cn:     	course.cos_cname,
				en:	        course.cos_ename,
				score:	    	course.score,
				grade:	    	course.score_level,
				realCredit: 	parseFloat(course.cos_credit),
				originalCredit:	parseFloat(course.cos_credit),
				complete:	(course.pass_fail == '通過'),
				year:	    	parseInt(course.cos_year) - school_year + 1,
				semester:   	parseInt(course.semester),
				type:	    	course.cos_type,
				code:	    	course.cos_code,
				english:    	false,
				reason:	    	'CS',
				move:	    	false
			};

			if(PCB_cos.cn.includes('物理'))
				PCB.physic.push(PCB_cos);
			else if(PCB_cos.cn.includes('化學'))
				PCB.chemistry.push(PCB_cos);
			else if(PCB_cos.cn.includes('生物')){
				if(PCB_cos.type == '通識'){
					courseResult[2].credit += PCB_cos.originalCredit;
					courseResult[2].course.push(PCB_cos);
				}else
					PCB.biology.push(PCB_cos);
			}
		}

		if(PCB.physic.length == 2){
			PCB.physic.forEach((cos) => {
				//One credit of physic becomes professional elective when two physic courses was taken.
				cos.realCredit = cos.originalCredit - 1;
				courseResult[0].credit += cos.realCredit;
				courseResult[0].course.push(JSON.parse(JSON.stringify(cos)));

				cos.realCredit = 1;
				//Identification for excessive one credit of physic.
				cos.code += '_one';
				courseResult[1].credit += cos.realCredit;
				courseResult[1].course.push(JSON.parse(JSON.stringify(cos)));
			});
			PCB.chemistry.forEach((cos) => {
				courseResult[2].credit += cos.originalCredit;
				courseResult[2].course.push(cos);
			});
			PCB.biology.forEach((cos) => {
				courseResult[2].credit += cos.originalCredit;
				courseResult[2].course.push(cos);
			});
		}else if(PCB.chemistry.length == 2){
			PCB.chemistry.forEach((cos) => {
				courseResult[0].credit += cos.originalCredit;
				courseResult[0].course.push(cos);
			});
			PCB.physic.forEach((cos) => {
				courseResult[2].credit += cos.originalCredit;
				courseResult[2].course.push(cos);
			});
			PCB.biology.forEach((cos) => {
				courseResult[2].credit += cos.originalCredit
				courseResult[2].course.push(cos);
			});
		}else if(PCB.biology.length == 2){
			PCB.biology.forEach((cos) => {
				courseResult[0].credit += cos.originalCredit;
				courseResult[0].course.push(cos);
			});
			PCB.chemistry.forEach((cos) => {
				courseResult[2].credit += cos.originalCredit;
				courseResult[2].course.push(cos);
			});
			PCB.physic.forEach((cos) => {
				courseResult[2].credit += cos.originalCredit;
				courseResult[2].course.push(cos);
			});
		}else{
			let cos_group_list = [
				PCB.physic,
				PCB.chemistry,
				PCB.biology
			];

			for(let i = 0; i < 3; i++){
				if(cos_group_list[i].length){
					cos_group_list[i].forEach((cos) => {
						courseResult[0].credit += cos.originalCredit;
						courseResult[0].course.push(cos);
					});
					cos_group_list.splice(i, 1);
					break;
				}
			}
			cos_group_list.forEach((cos_group) => {
				cos_group.forEach((cos) => {
					courseResult[2].credit += cos.originalCredit;
					courseResult[2].course.push(cos);
				});
			});
		}
        let Phy = 0, Che = 0, Bio = 0;
        let PhyCos = [], CheCos = [], BioCos = [];
        let PhyAt = [], CheAt = [], BioAt = [];
        for(let i = 0; i < courseResult[0].course.length; i++){
            let cos = courseResult[0].course[i];
            let cosName = courseResult[0].course[i].cn;
            if(cosName == "物理(一)" || cosName == "物理(二)"){
                Phy++;
                PhyCos.push(cos);
                PhyAt.push(i);
            }
            else if(cosName == "化學(一)" || cosName == "化學(二)"){
                Che++;
                CheCos.push(cos);
                CheAt.push(i);
            }
            else if(cosName == "生物(一)" || cosName == "生物(二)"){
                Bio++;
                BioCos.push(cos);
                BioAt.push(i);
            }
        }
        //console.log(PhyCos);
        //console.log(CheCos);
        //console.log(Che);
        //console.log(CheAt);
        if(Phy == 2){
            for(let i = 0; i < Che; i++){
                if(i != 0) CheAt[i]--;
                courseResult[0].course.splice(CheAt[i], 1);
                courseResult[2].course.push(CheCos[i]);
				courseResult[0].credit -= CheCos[i].originalCredit;
				courseResult[2].credit += CheCos[i].originalCredit;
            }
            for(let i = 0; i < Bio; i++){
                if(i != 0) BioAt[i]--;
                courseResult[0].course.splice(BioAt[i], 1);
                courseResult[2].course.push(BioCos[i]);
				courseResult[0].credit -= BioCos[i].originalCredit;
				courseResult[2].credit += BioCos[i].originalCredit;
            }
        }
        else if(Che == 2){
            for(let i = 0; i < Bio; i++){
                if(i != 0) BioAt[i]--;
                courseResult[0].course.splice(BioAt[i], 1);
                courseResult[2].course.push(BioCos[i]);
				courseResult[0].credit -= BioCos[i].originalCredit;
				courseResult[2].credit += BioCos[i].originalCredit;
            }
        }

	} else {
		res.redirect('/');
	}
	res.locals.courseResult = courseResult;
	//console.log(courseResult); 
	res.locals.English = EnglishCourse;
	res.locals.free = free;
	res.locals.notCS = notCS;
	next();
}

exports.CScourse = CScourse;
