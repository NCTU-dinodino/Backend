var express = require('express')
var router = express.Router()
var csrf = require('csurf')
var csrfProtection = csrf()
var table = require('./handler/table')

var dataFormDownload = table.table.dataFormDownload
var dataUpload = table.table.dataUpload
var dataLogShow = table.table.dataLogShow
var dataLogDelete = table.table.dataLogDelete
var dataLogDeleteAll = table.table.dataLogDeleteAll

/*下載空白檔案*/
router.post('/dataFormDownload' , csrfProtection, dataFormDownload, function(req, res){
    res.send(req.download)
})

/*上傳檔案*/
router.post('/dataUpload' , csrfProtection, dataUpload, function(req, res){
    res.send(req.signal)
})

/*取得所有紀錄*/
router.get('/dataLog', csrfProtection, dataLogShow, function(req, res){
    res.send(req.dataLog)
})

/*刪除特定紀錄*/
router.post('/dataLog/delete', csrfProtection, dataLogDelete, function(req, res){
    res.send(req.signal)
})

/*刪除所有紀錄*/
router.get('/dataLog/deleteAll', csrfProtection, dataLogDeleteAll, function(req, res){
    res.send(req.signal)
})

module.exports = router
