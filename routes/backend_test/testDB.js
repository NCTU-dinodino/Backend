var express = require('express');
var router = express.Router();
var query = require('../../db/msql');

router.get('/testDB', (req, res) => {
	let studentId = '';
	query.ShowUserAllScore(studentId, (err, result) => {
		result = JSON.parse(result);
		console.log(result);
	});
});

module.exports = router;
