var express = require('express');
var router = express.Router();

router.get('/logout', function(req, res){
	req.session.destroy((err) => {
		if(err)console.log('Unable to clear sessions');
	});
//  req.session.reset();
	res.redirect('/');
});

module.exports = router;
