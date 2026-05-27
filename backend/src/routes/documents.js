const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const upload = require('../config/multer')
const {
    getDocuments,
    uploadDocument,
    deleteDocument
} = require('../controllers/documentsController')


router.use(authenticate)

router.post('/upload', upload.single('file'), uploadDocument) // single file upload, field name is 'file'
router.get('/', getDocuments) // get all documents for user
router.delete('/:id', deleteDocument) // delete document by id

module.exports = router