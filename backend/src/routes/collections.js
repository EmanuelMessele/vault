const express = require('express')
const router = express.Router()
const autenticate = require('../middleware/auth')

const{
    getCollections,
    createCollection,
    getCollection,
    updateCollection,
    deleteCollection
} = require('../controllers/collectionsController')

router.use(autenticate)

router.get('/', getCollections)
router.post('/', createCollection)
router.get('/:id', getCollection)
router.put('/:id', updateCollection)
router.delete('/:id', deleteCollection)

module.exports = router