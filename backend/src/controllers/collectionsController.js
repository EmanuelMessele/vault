const pool = require('../db/index')

const getCollections = async (req, res) => {
    try{
        const result = await pool.query(
            `SELECT * FROM collections
            WHERE user_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC`,
            [req.user.userId]
        )

        res.json(result.rows)

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Internal server error' })
    }
}


const createCollection = async (req,res) => {
    try {
        const {name, description} = req.body

        if(!name)  {
            return res.status(400).json({ error: 'Name is required' })
            }

        const result = await pool.query(
            `INSERT INTO collections (user_id, name, description)
            VALUES ($1, $2, $3)
            RETURNING *`,
            [req.user.userId, name, description]
        )

        res.status(201).json(result.rows[0])
        } catch (err) {
            console.error('Create collection error:', err)
            res.status(500).json({ error: 'Internal server error' })
        }
    }

const getCollection = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM collections
            WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
            [req.params.id, req.user.userId]   
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Collection not found' })
        }

        res.json(result.rows[0])
    } catch (err) {
        console.error('Get collection error:', err)
        res.status(500).json({ error: 'Internal server error' })
    }

}

const updateCollection = async (req, res) => {
  try {
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await pool.query(
      `UPDATE collections
       SET name = $1, description = $2
       WHERE id = $3 AND user_id = $4 AND deleted_at IS NULL
       RETURNING *`,
      [name, description, req.params.id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update collection error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

const deleteCollection = async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE collections
       SET deleted_at = NOW()
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [req.params.id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' })
    }

    res.json({ message: 'Collection deleted' })
  } catch (err) {
    console.error('Delete collection error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  getCollections,
  createCollection,
  getCollection,
  updateCollection,
  deleteCollection
}