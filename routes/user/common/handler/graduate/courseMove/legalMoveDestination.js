var course = require('./course.js');
var query = require('../../../../../../db/msql');
var flow = require('asynchronous-flow');

const getLegalDestination = (req, res, next) => {
	var legal_destinations = [];

	var probable_destinations = [
		course.Elective,	//專業選修
		course.Course,		//其他選修(Any course can be changed to this type.)
		course.Language,	//外語
		course.General,		//通識
		course.PE,		//體育
		course.Service,		//服務學習
		course.Art,		//藝文賞析
		course.Graduate,	//抵免研究所課程
		course.AdditionProgram	//雙主修、輔系、學分學程
	];

	var course_info = req.body;
	var course_name = course_info.cn;
	var course_code = course_info.code;
	var course_type = course_info.type;
	var student_id = course_info.student_id;
    //console.log(course_info);

	var validation_functions = [];
	probable_destinations.forEach((cos_type) => {
		let validation_function = (next) => {
			cos_type.isValid(course_code, course_name, course_type, student_id, (type_names) => {
				type_names.forEach((type) => {
					legal_destinations.push(type);
				});
				next();
			});
		};
		validation_functions.push(validation_function);
	});
	
	var result = { "targets": legal_destinations };

	var flow_func = new flow();
	flow_func.setArgs()
		.setErrorHandler()
		.flow(...validation_functions, () => {
			res.send(result);
		});

	/*course.General.isValid(course_code, course_name, course_type, student_id, (type_names) => {
		console.log(type_names);
	});*/
	//console.log(student_id);
	/*query.ShowCosGroup(student_id, (err, result) => {
		console.log(result);
	});*/
}

module.exports = {
	getLegalDestination: getLegalDestination
}
