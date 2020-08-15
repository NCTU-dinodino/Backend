var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var table = require('./handler/table');

var mailSend = table.table.mailSend;
var mailSent = table.table.mailSent;
var mailInbox = table.table.mailInbox;
var mailInfo = table.table.mailInfo;
/*
router.post('/common/mail/send' , csrfProtection, mailSend, function(req, res){
    res.send(req.signal);

});

router.post('/common/mail/sent', csrfProtection, mailSent, function(req, res){
    res.send(req.sent);

});

router.get('/common/mail/inbox', csrfProtection, mailInbox, function(req, res){

    res.send(req.inbox);

});

router.post('/common/mail/info', csrfProtection, mailInfo, function(req, res){
    res.send(req.info);
});
*/

router.post('/sendMail', csrfProtection, mailSend, (req, res) => {
	res.send();
});

module.exports = router;
