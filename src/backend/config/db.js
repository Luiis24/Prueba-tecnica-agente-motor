const Database = require("better-sqlite3");

const db = new Database("./database/polizas.db");

module.exports = db;