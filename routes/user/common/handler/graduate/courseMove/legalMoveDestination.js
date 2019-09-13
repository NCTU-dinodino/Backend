var course = require('./course.js');
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
	var student_id = course_info.sId;

	var validation_functions = [];
	for(let course_type in probable_destinations){
		let validation_function = (next) => {
			course_type.isValid(course_name, course_code, course_type, student_id, (type_names) => {
				for(let type in type_name)
					legal_destinations.push({title: type});
				next();
			});
		};
		validation_functions.push(validation_function);
	}
	
	var flow_func = new flow();
	flow_func.setArgs()
		.setErrorHandler()
		.flow(...validation_functions, () => {
			res.send(legal_destinations);
		});
}

module.exports = {
	getLegalDestination: getLegalDestination
}
