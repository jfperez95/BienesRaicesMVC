import multer from "multer";
import path from 'path'
import {generarId} from '../helpers/token.js'

const storage = multer.diskStorage({
    destination: function(req, file, cb) {//La carpeta a donde se va a enviar
        cb(null, './public/uploads/')
    },
    filename: function(req, file, cb) {//se renombra el archivo
        cb(null, generarId() + path.extname(file.originalname))
    }
})

const upload = multer({storage})

export default upload