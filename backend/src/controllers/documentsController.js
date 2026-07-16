// controllers/documentsController.js --> this file contains the logic for handling document-related operations such as uploading, retrieving, and deleting documents.
const pool = require('../db/index')
const axios = require('axios')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-2' })
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'vault-uploads-858758524543'

const uploadDocument = async (req, res) => {
    try{
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const {collection_id} = req.body

        if(!collection_id){
            return res.status(400).json({ error: 'Collection ID is required' })
        }

        const collection = await pool.query(
            `SELECT id FROM collections
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [collection_id, req.user.userId]
        )

        if (collection.rows.length === 0){
            return res.status(404).json({ error: 'Collection not found' })
        }

        // upload to S3
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const s3Key = `uploads/${uniqueSuffix}-${req.file.originalname}`

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }))

        console.log('File uploaded to S3 with key:', s3Key)

        const result = await pool.query(
            `INSERT INTO documents (collection_id, user_id,file_name, file_type, file_size, storage_key, processing_status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *`, [collection_id, req.user.userId, req.file.originalname, req.file.mimetype, req.file.size, s3Key]
        )

        // Trigger AI processing asynchronously
        const document = result.rows[0]
        console.log('S3 key being sent to AI service:', s3Key)
        try {
            await axios.post('http://vault-alb-1816210994.us-east-2.elb.amazonaws.com:8000/api/documents/process', {
                document_id: document.id,
                s3_key: s3Key,
                s3_bucket: BUCKET_NAME,
                collection_id: collection_id,
                user_id: req.user.userId
            })
        } catch (aiError) {
            if(aiError.response){
                console.error('AI service response error:', aiError.response.status, aiError.response.data)
            } else if (aiError.request) {
                console.error('AI service no response:', aiError.message)
            } else {
                console.error('AI service error:', aiError.message)
            }
        }

        res.status(201).json(document)

    } catch (err) {
        
        console.error('Upload document error:', err)
        res.status(500).json({ error: 'Internal server error' })
    }
}

    const getDocuments = async (req,res) => {
        try {
            const {collection_id} = req.query

            let query = `SELECT * FROM documents WHERE user_id = $1 AND deleted_at IS NULL`
            let params = [req.user.userId]

            if(collection_id){
                query += ` AND collection_id = $2`
                params.push(collection_id)
            }

            query += ` ORDER BY created_at DESC`

            const result = await pool.query(query, params)
            res.json(result.rows)
        } catch (err) {
            console.error('Get documents error:', err)
            res.status(500).json({ error: 'Internal server error' })
        }
    }

    const deleteDocument = async(req,res) => {
        try{
            const result = await pool.query(
                `UPDATE documents
                SET deleted_at = NOW()
                WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
                RETURNING *`, [req.params.id, req.user.userId]
            )

            if(result.rows.length === 0){
                return res.status(404).json({ error: 'Document not found' })
            }

            res.json({ message: 'Document deleted successfully' })
        } catch (err) {
            console.error('Delete document error:', err)
            res.status(500).json({ error: 'Internal server error' })
        }
    }



module.exports = {
    uploadDocument,
    getDocuments,
    deleteDocument
}