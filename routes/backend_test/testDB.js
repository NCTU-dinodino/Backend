var express = require('express');
var router = express.Router();
var query = require('../../db/msql');

router.get(/testDB/, (req, res) => {
	let url = req.url;
	url = url.split('/');
	let studentId = url.pop();
	query.ShowUserAllScore(studentId, (err, result) => {
		result = JSON.parse(result);
		console.log(result);
	});
});

module.exports = router;
