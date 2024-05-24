import bcrypt from 'bcrypt'

const usuario = [
    {
        nombre: 'Juan',
        email: 'juan@juan.com',
        confrimado: 1,
        password: bcrypt.hashSync('123456', 10)
    }
]

export default usuario