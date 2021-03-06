var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var getStudentId = require('../common/handler/getStudentId');
var table = require('./handler/table');

var StudentId = getStudentId.getStudentId.studentId;
var researchStudentList = table.table.researchStudentList;
var researchProfessorList = table.table.researchProfessorList;
var researchGradeList = table.table.researchGradeList;
var researchGradeDownload = table.table.researchGradeDownload;
var researchSetScore = table.table.researchSetScore;
var researchDelete = table.table.researchDelete;
var researchSetAddStatus = table.table.researchSetAddStatus;
var researchSetCPEStatus = table.table.researchSetCPEStatus;
var researchStudentListDownload = table.table.researchStudentListDownload;
var researchSendWarningEmail = table.table.researchSendWarningEmail;
var researchNotInSystemList = table.table.researchNotInSystemList;
var researchNotOnCosList = table.table.researchNotOnCosList;
var researchGetCPEStatus = table.table.researchGetCPEStatus;
var researchWithdrawList = table.table.researchWithdrawList;

router.post('/assistants/research/studentList', csrfProtection, researchStudentList, function(req, res) {
// router.post('/assistants/project/StudentResearchList', csrfProtection, researchStudentList, function(req, res) {
    res.send(req.studentList);
});

router.post('/assistants/research/professorList', csrfProtection, researchProfessorList, function(req, res) {
// router.post('/assistants/project/ProResearchList', csrfProtection, researchProfessorList, function(req, res) {
    res.send(req.professorList);
});

router.post('/assistants/research/gradeList', csrfProtection, researchGradeList, function(req, res) {
// router.post('/assistants/ResearchGradeList', csrfProtection, researchGradeList, function(req, res) {
    res.send(req.gradeList);
});

router.post('/assistants/research/gradeDownload', csrfProtection, researchGradeDownload, function(req, res) {
// router.post('/assistants/ResearchGradeDownload', csrfProtection, researchGradeDownload, function(req, res) {
    res.send(req.gradeDownload);
});

router.post('/assistants/research/setScore', csrfProtection, researchSetScore, function(req, res) {
// router.post('/assistants/SetResearchGrade', csrfProtection, researchSetScore, function(req, res) {
    res.send();
});

router.post('/assistants/research/delete', csrfProtection, researchDelete, function(req, res) {
// router.post('/assistants/DeleteResearch', csrfProtection, researchDelete, function(req, res) {
    res.send();
});

router.post('/assistants/research/setAddStatus', csrfProtection, researchSetAddStatus, function(req, res) {
// router.post('/assistants/SetAddStatus', csrfProtection, researchSetAddStatus, function(req, res) {
    res.send(req.setAddStatus);
});

router.post('/assistants/research/setCPEStatus', csrfProtection, researchSetCPEStatus, function(req, res) {
// router.patch('/assistants/SetFirstSecond', csrfProtection, researchSetFirstSecond, function(req, res) {
    res.send();
});

router.post('/assistants/research/professorListDownload', csrfProtection, researchStudentListDownload, function(req, res) {
// router.post('/assistants/project/StudentResearchListDownload', csrfProtection, researchStudentListDownload, function(req, res) {
    res.send(req.studentListDownload);
});

router.post('/assistants/research/SendWarningEmail', csrfProtection, researchSendWarningEmail, (req, res) => {
	res.send();
});

router.post('/assistants/research/notInSystemList', csrfProtection, researchNotInSystemList, function(req, res) {
    res.send(req.notInSystemList);
});

router.post('/assistants/research/notOnCosList', csrfProtection, researchNotOnCosList, function(req, res) {
    res.send(req.notOnCosList);
});

router.post('/assistants/research/getCPEStatus', csrfProtection, researchGetCPEStatus, function(req, res) {
    res.send(req.getCPEStatus);
});

router.post('/assistants/research/withdrawList', csrfProtection, researchWithdrawList, function(req, res) {
    res.send(req.withdrawList);
});

module.exports = router;
