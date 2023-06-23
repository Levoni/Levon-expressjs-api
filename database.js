var sqlite3 = require('sqlite3').verbose()

const DBSOURCE = "Node.sqlite3"


let db = new sqlite3.Database(DBSOURCE, (err) => {
    if(err) {
        console.log(err.message)
        throw err
    } else {
        console.log('Connected to the SQLite database.')
    }
})

module.exports = db