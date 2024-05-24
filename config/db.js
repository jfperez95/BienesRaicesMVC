import Sequelize from "sequelize";//Concetar y configurar la db
import dotenv from 'dotenv'
//dotenv.config({path: '.env'})

const db = new Sequelize('railway', 'root', 'bCUVGkZuevWPxcOWDrntwCiBHhYKngVJ', {
    host: 'viaduct.proxy.rlwy.net',
    port: 57999,
    dialect: 'mysql',
    define: {
        timestamps: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    operatorAliases: false
});

export default db;
