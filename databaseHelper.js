module.exports = {
    select: (sql, params, db) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    update: (sql, params, db) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    insert: (sql, params, db) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params,(err, rows)=> {
                if(err) {
                    console.log('sql error:')
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    selectUser: (userName, db) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * from user where name = ? LIMIT 1' , userName, (err, rows) => {
                if(err) {
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    },

    selectCurrentNumber: ( db) => {
        return new Promise((resolve, reject) => {
            db.all('SELECT * from Numbers order by id DESC LIMIT 1' , [], (err, rows) => {
                if(err) {
                    console.log(err)
                }
                return resolve({err:err,rows:rows})
            })
        })
    }
}