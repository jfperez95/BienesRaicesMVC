import {check, validationResult} from 'express-validator'
import bcrypt from 'bcrypt'
import Usuario from '../models/Usuario.js'
import { generarId, generarJWT } from '../helpers/token.js'
import {emailRegistro, emailOlvidePassword} from '../helpers/email.js'

const formularioLogin = (req, res) =>{
    res.render('auth/login', {
        pagina: 'Iniciar Sesión',
        csrfToken: req.csrfToken()
    })
}

const autenticar = async (req, res) => {
    await check('email').isEmail().withMessage('Debe ingresar un usuario para iniciar sesión').run(req)
    await check('password').notEmpty().withMessage('El Password es obligatorio').run(req)
    
    let resultado= validationResult(req)
    
    if(!resultado.isEmpty()){
        return res.render('auth/login', {
            pagina: 'Iniciar Sesión',
            csrfToken : req.csrfToken(),
            errores: resultado.array()
        })
    }

    const {email, password} = req.body

    //Comprobar si el usuario existe
    const usuario = await Usuario.findOne({where: {email}})
    

    if(!usuario){
        return res.render('auth/login', {
            pagina: 'Inicio de Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario no existe'}]            
        })
    }
    
    //Comprobar si el usuario esta confirmado
    if(!usuario.confirmado){
        return res.render('auth/login', {
            pagina: 'Inicio de Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'Tu cuenta no ha sido confirmada'}]
        })
    }

    //Revisar el password
    if(!usuario.verificarPassword(password)){
        return res.render('auth/login', {
            pagina: 'Inicio de Sesión',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El password es incorrecto'}]
        })
    }
    
    //Autenticar al usuario
    const token = generarJWT(usuario.id)

    //Almacenar en un cookie
    
    return res.cookie('_token', token, {
        httpOnly: true,
        //secure: true,
        //sameSite: true
    }).redirect('/mis-propiedades')
}

const cerrarSesion = (req, res) => {
    return res.clearCookie('_token').status(200).redirect('/auth/login')
}

const formularioRegistro = (req, res) => {


    res.render('auth/registro', {
        pagina : 'Crear Cuenta',
        csrfToken: req.csrfToken()
    })
}

const registrar = async (req, res) =>{
    //Validacion
    await check('nombre').notEmpty().withMessage('El nombre no puede ir vacío').run(req)
    await check('email').isEmail().withMessage('Tiene que ser un email').run(req)
    await check('password').isLength({min: 6}).withMessage('El passwor debe ser de al menos 6 caracteres').run(req)
    await check('repetir_password').equals(req.body.password).withMessage('Los passwords no son iguales').run(req)

    let resultado = validationResult(req)//Dices cual fue el resultado de las validaciones
    //Verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        //Errores
        
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: resultado.array(),
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }
    //Extraer los datos
    const{nombre, email, password} = req.body

    //Verificar que el usuario no esté duplicado
    const existeUsuario = await Usuario.findOne({where : {email}})
    if(existeUsuario){
        return res.render('auth/registro', {
            pagina: 'Crear Cuenta',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El usuario ya está registrado'}],
            usuario: {
                nombre: req.body.nombre,
                email: req.body.email
            }
        })
    }
    
//Almacenar un usuario
    const usuario = await Usuario.create({
        nombre,
        email,
        password,
        token: generarId()
    })

    //Enviar email de confirmacion
    emailRegistro({
        nombre: usuario.nombre,
        email: usuario.email,
        token: usuario.token
    })

    //Mostrar mensaje de confirmación
    res.render('templates/mensaje', {
        pagina: 'Cuenta Creada Correctamente',
        mensaje: 'Hemos enviado un email de confirmación, preciona en el enlace'
    })
}

    //Funcion que comprueba una cuenta 
    const confirmar = async (req, res) => {
        const {token} = req.params;
        
        //Verificar si el token es valido

        const usuario = await Usuario.findOne({where: {token}})

        if(!usuario){
            return res.render('auth/confirmar-cuenta', {
                pagina: 'Error al confirmar tu cuenta',
                mensaje: 'Hubo un error al confirmar tu cuenta, intenta de nuevo',
                error: true
            })
        }

        //Confirmar cuenta
        usuario.token = null;
        usuario.confirmado = true;
        await usuario.save();

        res.render('auth/confirmar-cuenta', {
            pagina: 'Cuenta confirmada',
            mensaje: 'La cuenta se confirmo correctamente'
        })
    }


const formularioOlvidePassword = (req, res) => {
    res.render('auth/olvide-password', {
        pagina : 'Recupera tu acceso a biener raices',
        csrfToken: req.csrfToken()
    })
}

const resetPassword = async (req, res) =>{
    //Validacion    
    await check('email').isEmail().withMessage('Tiene que ser un email').run(req)

    let resultado = validationResult(req)//Dices cual fue el resultado de las validaciones
    //Verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        //Errores
        
        return res.render('auth/olvide-password', {
            pagina : 'Recupera tu acceso a biener raices',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    //Buscar el usuario

    const {email} = req.body

    const usuario = await Usuario.findOne({where: {email}})
    if(!usuario){
        return res.render('auth/olvide-password', {
            pagina : 'Recupera tu acceso a biener raices',
            csrfToken: req.csrfToken(),
            errores: [{msg: 'El Email no Pertenece a ningún usuario'}]
        })
    }

    //Generar un token y enviar el email
    usuario.token = generarId();
    await usuario.save()

    //Enviar un email
    emailOlvidePassword({
        email: usuario.email,
        nombre: usuario.nombre,
        token: usuario.token
    })

    //Renserizar un mensaje
    res.render('templates/mensaje', {
        pagina: 'Reestablece tu Password',
        mensaje: 'Hemos enviado un email con las instrucciones'
    })
}

const comprobarToken = async (req, res) =>{
    const {token} = req.params

    const usuario = await Usuario.findOne({where: {token}})
    if(!Usuario){
        return res.render('auth/confirmar-cuenta', {
            pagina: 'Reestablece tu password',
            mensaje: 'Hubo un error al validar tu informacion, intenta de nuevo',
            error: true
        })
    }

    //Mostrar formulario para modificar el password
    res.render('auth/reset-password', {
        pagina: 'Reestablece tu password',
        csrfToken: req.csrfToken()
    })

}

const nuevoPassword = async (req, res) => {
    //Validar el password
    await check('password').isLength({min: 6}).withMessage('El passwor debe ser de al menos 6 caracteres').run(req)
    let resultado = validationResult(req)//Dices cual fue el resultado de las validaciones
    //Verificar que el resultado esté vacío
    if(!resultado.isEmpty()){
        return res.render('auth/reset-password', {
            pagina: 'Reestablece tu Password',
            csrfToken: req.csrfToken(),
            errores: resultado.array()
        })
    }

    const {token} = req.params
    const {password} = req.body

    //Identificar quien hace el cambio
    const usuario = await Usuario.findOne({where: {token}})

    
    //Hashear el nuevo password
    const salt = await bcrypt.genSalt(10)
    usuario.password = await bcrypt.hash(password, salt)
    usuario.token = null

    await usuario.save()

    res.render('auth/confirmar-cuenta', {
        pagina: 'Password Reestablecido',
        mensaje: 'El Password se guardo correctamente'
    })

}

export {
    formularioLogin,
    autenticar,
    formularioRegistro,
    formularioOlvidePassword,
    registrar,
    confirmar,
    resetPassword,
    comprobarToken,
    nuevoPassword,
    cerrarSesion
}