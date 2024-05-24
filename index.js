import express from 'express';
import csrf from 'csurf'
import cookieParser from 'cookie-parser';
import usuarioRoutes from './routes/usuarioRoutes.js'
import propiedadesRoutes from './routes/propiedadesRoutes.js'
import appRoutes from './routes/appRoutes.js'
import apiRoutes from './routes/apiRoutes.js'
import db from './config/db.js'

//Crear la app
const app = express()

//Habilitar lectura de datos de formulario
app.use(express.urlencoded({extended: true}))

//Habilitar Cookie parser
app.use(cookieParser())

//Habilitar el CSRF
app.use(csrf({cookie: true}))


//Conexion a la base de datos
try{
    await db.authenticate();
    db.sync()
    console.log('Conexion Correcta a la base de datos')
}catch(error){
    console.log(error)
}

//Habilitar Pug
app.set('view engine', 'pug')
app.set('views', './views')

//Carpeta publica
app.use(express.static('public'))

//Routing
app.use('/', appRoutes)
app.use('/auth', usuarioRoutes)
app.use('/', propiedadesRoutes)
app.use('/api', apiRoutes)

//Definir un puerto y arrancar el proyectp
const port = 3000;

app.listen(port, () => {
    console.log(`El servidor esta funcionando en el puerto ${port}`)
});
