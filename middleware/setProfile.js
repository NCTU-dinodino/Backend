var utils = require('../utils');
var query = require('../db/msql');

module.exports.setProfile = function(req, res, next){
  if(req.session.profile) {
      var profileObj = JSON.parse(req.session.profile);
      var personId = utils.getPersonId(profileObj);
      var grade = parseInt(personId.substring(0,2)) + 100;
      
      //if(personId != '0316201'){
      		query.ShowUserInfo(personId,function(err,result){
          		if(err){
                		throw err;
                		return;
          		}
          		result = JSON.parse(result);
          		if(result){
					if(result.length == 0) req.profile = 'Not Found';
              		else req.profile = result;
          		}else req.profile = 'Not Found';
				next();
	 		//query.close();
      		});
      //}
      //else
		//next();
   } 
    else {
		req.profile = 'Not Found';
      	next();
    }
}
