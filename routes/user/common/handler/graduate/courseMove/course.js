var query = require('../../../../../../db/msql');
var Course = {
	isValid : function(code, name, type, student_id, callback){
		let destination = null;
		query.ShowCosGroup(student_id, (err, result) => {
			if(err){
				callback([]);
				return;
			};

			let course_groups = JSON.parse(result);

			course_groups.forEach((course_group) => {
				if(course_group.cos_codes.some((cos_code) => (cos_code + '_one' == code)))
					destination = ['其他選修'];
				else if(course_group.cos_codes.some((cos_code) => (code.startsWith(cos_code))) && course_group.type == '必修')
					destination = [];
			});

            //PYY : 體育, GEC & CGE : 共教會 ＆ 通識中心, MIN : 護理
			if(type == '軍訓' || code.startsWith('PYY') || name == '藝文賞析教育' || code.startsWith('GEC') || code.startsWith('CGE') || code.startsWith('MIN') || name == '服務學習(一)' || name == '服務學習(二)')	//Only for restriction of 09
				destination = [];

			if(destination == null)
				destination = ['其他選修'];

			callback(destination);
		});
	}
}

var Elective = {
	isValid(code, name, type, student_id, callback){
		let destination = null;
		query.ShowCosGroup(student_id, (err, result) => {
			if(err){
				callback([]);
				return;
			}

			let course_groups = JSON.parse(result);

			course_groups.forEach((course_group) => {
				if(course_group.cos_codes.some((cos_code) => (code == cos_code + '_one')))
					destination = ['專業選修'];
                else if(course_group.cos_codes.some((cos_code) => (code.startsWith(cos_code)))
					&& type == '必修')
					destination = [];
			});
			
			let EE_cos_codes = [
				'UEE2101',
				'DEE2548',
				'DEE2542',
				'UEE2601',
				'UEE4605'
			];
			if(destination == null && EE_cos_codes.some((cos_code) => (code.startsWith(cos_code))))
				destination = ['專業選修'];
		
			let CS_cos_codes_prefix = [
				'DCP',
				'IOC',
				'IOE',
				'ILE',
				'IDS'
			];
			if(destination == null && CS_cos_codes_prefix.some((cos_code) => (code.startsWith(cos_code)))){
				let invalid_course_name = [
					'服務學習(一)',
					'服務學習(二)',
					'導師時間',
					'教學實務',
					'個別研究'
				];

				if(invalid_course_name.some((cos_name) => (name == cos_name)))
					destination = [];
				else
					destination = ['專業選修'];

				if(code == 'IOC5189' && student_id.startsWith('08'))
					destination = [];
			}

			if(destination == null)
				destination = [];

			callback(destination);
		});
	}
}

var Language = {
	isValid(code, name, type, student_id, callback){
		let destination = null;

		if(type == '外語')
			destination = ['外語'];
		else 
			destination = [];

		callback(destination);
	}
}

var General = {
	isValid(code, name, type, student_id, callback){
		let destination = null;
		query.ShowUserAllScore(student_id, (err, result) => {
			if(err){
				callback([]);
				return;
			}

			let courses = JSON.parse(result);
			let course = courses.find((cos) => (code.startsWith(cos.cos_code)));
            if(!course){
                query.ShowUserOnCos(student_id, (error, res) => {
                    if(error){
                        callback([]);
                        return;
                    }
                    let now = JSON.parse(res);
                    course = now.find((cos) => (code.startsWith(cos.cos_code)));
                });
            }
		    //console.log(course);
            setTimeout(function(){
		    	if(course.cos_type == '必修'){
		    		callback([]);
		    		return;
		    	}

		    	if(course.brief)
		    		switch(course.brief_new[0]){
		    			case '校':case '核':case'跨':
		    				destination = [];
		    				destination.push('通識(舊制)-' + course.brief.split('/')[0]);
		    				//console.log(course.brief_new.split(','));
		    				course.brief_new.split(',').forEach((dim) => {
		    					destination.push('通識(新制)-' + dim.substring(0, dim.length - 5));
		    				});
		    				//destination = '通識(舊制)-' + course.brief + '|通識(新制)-' + course.brief_new;
						break;
					default:
		    				destination.push('通識(舊制)-' + course.brief.split('/')[0]);
		    		}
		    	if(destination == null)
		    		destination = [];

		    	callback(destination);
            }, 1000);
		});
	}
}

var PE = {	
	isValid(code, name, type, student_id, callback){
		let destination = null;
		if(code.startsWith('PYY'))
			destination = ['體育'];
		else
			destination = [];

		callback(destination);
	}
}

var Service = {
	isValid(code, name, type, student_id, callback){
		let destination = null;
		if(type === "服務學習" || type === "通識服務學習")
			destination = ['服務學習'];
		else
			destination = [];

		callback(destination);
	}
}

var Art = {
	isValid(code, name, type, student_id, callback){
		let destination = null;
		if(name == '藝文賞析教育')
			destination = ['藝文賞析'];
		else
			destination = [];

		callback(destination);
	}
}

var Graduate = {
	isValid(code, name, type, student_id, callback){
		let destination = null;
		let graduate_cos_codes_prefix = [
			'IOC',
			'IOE',
			'ILE',
			'IDS'
		];
		if(graduate_cos_codes_prefix.some((cos_code) => (code.startsWith(cos_code))) || type == '大學部修研究所課程')
			destination = ['抵免研究所課程'];
		else 
			destination = [];

		callback(destination);
	}
}

var AdditionProgram = {
	isValid(code, name, type, student_id, callback){
		let destination = null;
		if(type == '必修')
			destination = [];
		else 
			destination = ['雙主修、輔系、學分學程'];

		callback(destination);
	}
}


module.exports = {
	Course: Course,
	Elective: Elective,
	Language: Language,
	General: General,
	PE: PE,
	Service: Service,
	Art: Art,
	Graduate: Graduate,
	AdditionProgram: AdditionProgram
}
