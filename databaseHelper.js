module.exports = {
    database: null,
    select: (sql, params) => {
        return new Promise((resolve, reject) => {
            module.exports.database.all(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    update: (sql, params) => {
        return new Promise((resolve, reject) => {
            module.exports.database.run(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    delete: (sql, params) => {
        return new Promise((resolve, reject) => {
            module.exports.database.run(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:null})
            })
        })
    },

    insert: (sql, params) => {
        return new Promise((resolve, reject) => {
            module.exports.database.run(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    insertAndGet: (sql, params) => {
        return new Promise((resolve, reject) => {
            module.exports.database.get(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    selectUser: (userName) => {
        return new Promise((resolve, reject) => {
            module.exports.database.all('SELECT * from user where name = ? LIMIT 1' , userName, (err, rows) => {
                if(err) {
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    selectCurrentNumber: () => {
        return new Promise((resolve, reject) => {
            module.exports.database.all('SELECT * from Numbers order by id DESC LIMIT 1' , [], (err, rows) => {
                if(err) {
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    }
}