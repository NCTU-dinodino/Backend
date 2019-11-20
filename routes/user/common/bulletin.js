var express = require('express')
var router = express.Router()
var csrf = require('csurf')
var csrfProtection = csrf()
var table = require('./handler/table')

var bulletinShow = table.table.bulletinShow
var bulletinCreate = table.table.bulletinCreate
var bulletinEdit = table.table.bulletinEdit
var bulletinDelete = table.table.bulletinDelete

/*取得所有公告*/
router.get('/bulletin', csrfProtection, bulletinShow, function(req, res){
    res.send(req.bulletin)
})

/*新增公告*/
router.post('/bulletin' , csrfProtection, bulletinCreate, function(req, res){
    res.status(req.signal).end()
})

/*編輯公告*/
router.post('/bulletin/edit', csrfProtection, bulletinEdit, function(req, res){
    res.status(req.signal).end()
})

/*刪除公告*/
router.post('/bulletin/delete', csrfProtection, bulletinDelete, function(req, res){
    res.status(req.signal).end()
})

module.exports = router
