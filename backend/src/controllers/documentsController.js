const pool = require('../db/index')
const path = require('path')
const fs = require('fs')

const uploadDocument = async (req, res) => {
    try{
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' })
        }

        const {collection_id} = req.body

        if(!collection_id){
            fs.unlink(req.file.path)
            return res.status(400).json({ error: 'Collection ID is required' })
        }

        const collection = await pool.query(
            `SELECT id FROM collections
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`, [collection_id, req.user.userId]
        )

        if (collection.rows.length === 0){
            fs.unlink(req.file.path)
            return res.status(404).json({ error: 'Collection not found' })
        }

        const result = await pool.query(
            `INSERT INTO documents (collection_id, user_id,file_name, file_type, file_size, storage_key, processing_status)
            VALUES ($1, $2, $3, $4, $5, $6, 'pending')
            RETURNING *`, [collection_id, req.user.userId, req.file.originalname, req.file.mimetype, req.file.size, req.file.filename]
        )

        res.status(201).json(result.rows[0])

    } catch (err) {
        if(req.file) fs.unlinkSync(req.file.path)
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