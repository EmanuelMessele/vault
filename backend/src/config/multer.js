const multer = require('multer')


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
    storage: multer.memoryStorage(), // Store file in memory
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
})

module.exports = upload
