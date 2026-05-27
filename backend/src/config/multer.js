const multer = require('multer')
const path = require('path')
const fs = require('fs')


const uploadDir = path.join(__dirname, '../../uploads')
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination:(req,file,cb) => {
        cb(null, uploadDir)
    },
    filename: (req,file,cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null,uniqueSuffix + path.extname(file.originalname))
    }
})

const fileFilter = (req,file,cb) => {
    const allowedTypes = ['application/pdf', 'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    if(allowedTypes.includes(file.mimetype)){
        cb(null, true)
    } else {
        cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'))
    }
}

const upload = multer({
    storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

module.exports = upload
