const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express()
const port = 3752
const secret = 'VerySecret'
const HREF = process.env.appvirtdir ? process.env.appvirtdir : ''

var db = require("./database.js")
var dbHelper = require("./databaseHelper.js")
var dateHelper = require("./dateHelper.js")
var md5 = require('md5')

const corsOpts = {
  origin: '*',

  methods: [
    'GET',
    'POST',
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept'
  ],
};

app.use(express.json(),
        cors(corsOpts))



app.get(HREF + '/', (req, res) => {
  res.send('Hello World!')
})

app.post(HREF + '/auth/accessToken', (req,res) => {
  let {code} = req.body
  if(!code) {
    res.status(400).json({"error":"body is missing code"})
    return
  }

  fetch('https://oauth2.googleapis.com/token?' +
  `redirect_uri=http://localhost:3000/auth/google` +
  `&code=${code}` +
  `&client_id=` +
  `&client_secret=` +
  `&scope=&grant_type=authorization_code`,{
    method:'POST'
  }).then((data) => {
    data.json().then((jsonData) => {
      res.status(200).json(jsonData)
    })
  })
})

app.post(HREF + '/auth/user/accessToken', (req,res) => {
  let {code} = req.body
  if(!code) {
    res.status(400).json({"error":"body is missing code"})
    return
  }
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"auth token was not provided"})
    return
  }
  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }
  var loweredName = decodedToken.name

  fetch('https://oauth2.googleapis.com/token?' +
  `redirect_uri=http://localhost:3000/auth/google` +
  `&code=${code}` +
  `&client_id=` +
  `&client_secret=` +
  `&scope=&grant_type=authorization_code`,{
    method:'POST'
  }).then((data) => {
    data.json().then((jsonData) => {
      dbHelper.update('update user set refresh_token=? where name=?',[jsonData.refresh_token,loweredName],db)
      res.status(200).json(jsonData)
    })
  })
})

app.post(HREF + '/auth/refreshToken', (req,res) => {
  let {token} = req.body
  if(!token) {
    res.status(400).json({"error":"body is missing code"})
    return
  }

  fetch('https://oauth2.googleapis.com/token' +
  '?client_secret=' +
  '&grant_type=refresh_token' +
  `&refresh_token=${token}` +
  '&client_id=',{
    method:'POST'
  }).then((data) => {
    data.json().then((jsonData) => {
      res.status(200).json(jsonData)
    })
  })
})

app.post(HREF + '/auth/user/refreshToken', async (req,res) => {
  let {name, password} = req.body
  if(!name || !password) {
    res.status(400).json({"error":"sign up information not supplied in body"})
    return
  }
  var loweredName = name.toLowerCase()
  var encodedpassword = md5(password)
  var result = await dbHelper.select(`SELECT * from user where name = ? and secret = ?`,[loweredName,encodedpassword],db)
  if(result.err) { //TODO: check if this works
    res.status(400).json({"error":"No User exists for that name and password"})
    return
  }
  
  fetch(HREF + 'https://oauth2.googleapis.com/token' +
  '?client_secret=' +
  '&grant_type=refresh_token' +
  `&refresh_token=${user[0].refresh_token}` +
  '&client_id=',{
    method:'POST'
  }).then((data) => {
    data.json().then((jsonData) => {
      res.status(200).json(jsonData)
    })
  })
})

app.get(HREF + '/user', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }
  var loweredName = decodedToken.name

  var result = await dbHelper.select('SELECT name, guesses, correct_guesses, points, last_daily_guess, is_admin from user where name = ? LIMIT 1', [loweredName], db)
  if(result.err) {
    res.status(400).json({"error":"No User with this name exists"})
  } else {
    res.status(200).json(result.rows[0])
  }
})

app.get(HREF + '/users', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }

  var result = await dbHelper.select('SELECT name, guesses, correct_guesses, points, last_daily_guess, is_admin from user', [], db)
  if(result.err) {
    res.status(400).json({"error":"No User with this name exists"})
  } else {
    res.status(200).json(result.rows)
  }
})

app.get(HREF + '/numberWins', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  let sql = 'SELECT * from Numbers where winner is not null order by id desc limit 10'
  let numberResults = await dbHelper.select(sql, [], db)
  if(numberResults.err) {
    res.status(500).json({"error":"error while getting numbers"})
    return
  }
  return res.status(200).json(numberResults.rows)
})

app.get(HREF + '/info/guess/user', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }
  var loweredName = decodedToken.name

  var userResult = await dbHelper.selectUser(loweredName, db)
  if(userResult.err) {
    res.status(400).json({"error":"No user with that name"})
    return
  }
  var currentNumber = await dbHelper.selectCurrentNumber(db)
  var userGuessInfo = await dbHelper.select('Select * from guess where name = ? and guess_id = ?', [userResult.rows[0].name, currentNumber.rows[0].id], db)
  res.status(200).json({"guessInfo":userGuessInfo.rows, "numberId":currentNumber.rows[0].id})
  return
})

app.post(HREF + '/guess/:number', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }
  if(req.params.length == 0) {
    res.status(400).json({"error":"path paramater number is required"})
    return
  }
  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }
  var loweredName = decodedToken.name

  var guess = req.params['number']

  const userResults = await dbHelper.select('SELECT * from user where name = ? LIMIT 1',[loweredName],db)

    if(userResults.err) {
      res.status(400).json({"error":"No User with this name"})
    } else {
      const user = userResults.rows[0]
      const lastGuessDate = new Date(user.last_daily_guess + 'Z')
      const currentDate = new Date()
      if(lastGuessDate.getUTCDate() == currentDate.getUTCDate() &&
        lastGuessDate.getUTCMonth() == currentDate.getUTCMonth()) {
          res.status(200).json({"result":false,"Message":"You have already guessed for today"})
          return
      }

      const numResults = await dbHelper.select('SELECT * from Numbers order by id DESC LIMIT 1',[],db)
      if(numResults.err) {
        res.status(200).json({"result":false,"Message":"No number available to guess yet" })
        return
      }
      if(numResults.rows[0]['winner']) {
        res.status(200).json({"result":false,"Message":"Number was already guessed" })
        return
      }
      if(guess == numResults.rows[0]['Number']) {
        dbHelper.update(`Update user set correct_guesses=?,guesses=?,last_daily_guess=?,points=? where name=?`,
        [user.correct_guesses + 1, user.guesses + 1, dateHelper.GetYYYYMMDDhhmmss(new Date()), user.points + 1000, user.name],
        db)
        dbHelper.update(`Update Numbers set winner=? where id=?`,[user.name, numResults.rows[0].id], db)
        dbHelper.insert('INSERT into guess (guess_id,name,guess,result) values(?,?,?,?)',[numResults.rows[0].id,user.name,guess,'Congradulations! You guessed correcttly'],db)
        let randomNumber = Math.floor(Math.random() * 100)
        dbHelper.insert('INSERT into Numbers (Number) values (?)',[randomNumber],db)
        res.status(200).json({"result":true,"Message":"Congradulations! You guessed correcttly"})
        return
      } else {
        dbHelper.update(`Update user set guesses=?,last_daily_guess=? where name=?`,
        [user.guesses + 1, dateHelper.GetYYYYMMDDhhmmss(new Date()), user.name],
        db)
        
        if(guess < numResults.rows[0]['Number']) {
          dbHelper.insert('INSERT into guess (guess_id,name,guess,result) values(?,?,?,?)',[numResults.rows[0].id,user.name,guess,'Incorrect, too low'],db)
          res.status(200).json({"result":false,"Message":"Incorrect, too low"})
        } else {
          dbHelper.insert('INSERT into guess (guess_id,name,guess,result) values(?,?,?,?)',[numResults.rows[0].id,user.name,guess,'Incorrect, too high'],db)
          res.status(200).json({"result":false,"Message":"Incorrect, too high"})
        }
        return
      }
    }

})

app.post(HREF + '/signup', (req,res) => {
  let {name, password} = req.body
  if(!name || !password) {
    res.status(400).json({"error":"Sign up information not supplied in body"})
    return
  }
  var loweredName = name.toLowerCase()
  var encodedpassword = md5(password)
  var sql = 'INSERT INTO user (name, secret, guesses, correct_guesses, is_admin) VALUES (?,?,?,?, false)'
  var params = [loweredName, encodedpassword, 0, 0]
  db.run(sql, params, (err, rows) => {
    if(err) {
      if(err.errno == 19) {
        res.status(400).json({"error":'User already exists'})
        return
      } else {
        res.status(500).json({"error":'Error when creating a new user'})
        return
      }
    } else {
      let token = jwt.sign({name: loweredName}, secret, {expiresIn: "5h"})
      res.status(200).json({"token":token})
      return
    }
  })
})

app.post(HREF + '/login', async (req,res) => {
  let {name, password} = req.body
  if(!name || !password) {
    res.status(400).json({"error":"Login information not supplied in body"})
    return
  }

  let loweredName = name.toLowerCase()
  var encodedpassword = md5(password)
  let selectResult = await dbHelper.select('SELECT * from user where name = ? and secret = ? LIMIT 1', [loweredName, encodedpassword],db)
  if(!selectResult.rows || selectResult.rows.length == 0) {
    res.status(400).json({"error":"User does not exist"})
    return
  } else {
    let token = jwt.sign({name: selectResult.rows[0].name}, secret, {expiresIn: "5h"})
    res.status(200).json({"token":token})
    return
  }
})

app.get(HREF + '/game', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  let sql = 'SELECT * from game'
  let gameResults = await dbHelper.select(sql, [], db)
  return res.status(200).json(gameResults.rows)
})

app.get(HREF + '/site', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  let sql = 'SELECT * from daily_sites'
  let siteResults = await dbHelper.select(sql, [], db)
  return res.status(200).json(siteResults.rows)
})

app.get(HREF + '/userSiteLink', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }
  let params = req.query
  if(params) {
    let whereClauses = []
    if(params.date) {
      whereClauses.push(`site_day_date = '${params.date}'`)
    }
    if(params.site) {
      whereClauses.push(`daily_site_name = '${params.site}'`)
    }
    if(params.userName) {
      whereClauses.push(`user_name = '${params.userName}'`)
    }


    var whereString = '';
    if(whereClauses.length > 0) {
      whereString = ' where '
      for (let i = 0; i < whereClauses.length; i++) {
        if(i != 0) {
          whereString += ' and '
        }
        whereString += whereClauses[i]
      }
    }

    let selectSql = `SELECT * from user_site_link`
    let selectResult = await dbHelper.select(selectSql + whereString, [],db)
    if(selectResult.err) {
      res.status(500).json({"error":"server threw an error"})
      return
    }
    res.status(200).json(selectResult.rows)
    return
  }
  res.status(200).json([])
  return
})

app.post(HREF + '/game/add', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }
  let {name, platform, player_min, player_max, genre} = req.body
  if(!name || !platform || !player_min || !player_max || !genre) {
    res.status(400).json({"error":"Required game info missing"})
    return
  }
  let selectSql = 'SELECT * from game WHERE name = ?'
  let gameSelectResult = await dbHelper.select(selectSql, [name], db)
  if(gameSelectResult.err) {
    res.status(500).json({'error':'Error while inserting game'})
    return
  }
  if(gameSelectResult.rows && gameSelectResult.rows.length > 0) {
    let updateSql = 'UPDATE game set platform = ?,player_min = ?, player_max = ?, genre = ? where name = ?'
    let updateResults = await dbHelper.update(updateSql,[platform,player_min,player_max,genre,name],db)
    if(updateResults.err) {
      res.status(500).json({'error':'Error while inserting game'})
      return
    }
    return res.status(200).json({'success':'Game Updated'})
  } else {
    let sql = 'INSERT INTO game (name,platform,player_min,player_max,genre) values(?,?,?,?,?)'
    let gameInsertResult = await dbHelper.insert(sql, [name,platform,player_min,player_max,genre], db)
    if(gameInsertResult.err) {
      if(gameInsertResult.err.errno == 19) {
        res.status(400).json({'error':'Game already exists'})
        return
      } else {
        res.status(500).json({'error':'Error while inserting game'})
        return
      }
    }
    return res.status(200).json({'success':'Game Added'})
  }
})

app.post(HREF + '/gamelink/add', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  let {game_name, installed} = req.body
  if(!game_name) {
    res.status(400).json({"error":"Required game link info missing"})
    return
  }
  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }
  var loweredName = decodedToken.name
  

  let selectSQL = 'Select * from user_game_link where user_name = ? and game_name = ?'
  let selectResults = await dbHelper.select(selectSQL,[loweredName, game_name],db)
  if(selectResults.err) {
    res.status(500).json({"error":"Error while inserting game link"})
    return
  }
  if(selectResults.rows.length > 0) {
    let updateSQL = 'UPDATE user_game_link set installed = ? WHERE user_name = ? and game_name = ?'
    let updateResults = await dbHelper.update(updateSQL, [installed, loweredName, game_name], db)
    if(updateResults.err) {
      res.status(500).json({"error":"Error while updating game link"})
      return
    } else {
      res.status(200).json({'success':'Game Link Updated'})
      return
    }
  } else {
    let sql = 'Insert Into user_game_link (user_name,game_name,installed) values(?,?,?)'
    let gameLinkInsertResult = await dbHelper.insert(sql,[loweredName, game_name, installed],db)
    if(gameLinkInsertResult.err) {
      res.status(500).json({"error":"Error while inserting game link"})
      return
    } else {
      res.status(200).json({'success':'Game Link Added'})
      return
    }
  }
})

app.post(HREF + '/site/add', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }
  let {name, reset_time, link} = req.body
  if(!name || !reset_time || !link) {
    res.status(400).json({"error":"Required site info missing"})
    return
  }

  let selectSql = 'select * from daily_sites where name = ?'
  let selectResult = await dbHelper.select(selectSql, [name], db)
  if(selectResult.err) {
    res.status(500).json({'error':'Error Creating Site'})
    return
  } else {
    if(selectResult.rows && selectResult.rows.length > 0) {
      let updateSql = 'Update daily_sites set reset_time = ?, link = ? where name = ?'
      let updateResult = await dbHelper.update(updateSql, [reset_time,link,name], db)
      if(updateResult.err) {
        res.status(500).json({'error':'Error Creating Site'})
        return
      }
      res.status(200).json({'success':'Site Updated'})
      return
    } else {
      let sql = 'INSERT INTO daily_sites (name, reset_time, link) values(?,?,?)'
      let results = await dbHelper.insert(sql,[name,reset_time,link],db);
      if(results.err) {
        res.status(500).json({'error':'Error Creating Site'})
        return
      }
      res.status(200).json({'success':'Site Created'})
      return
    }
  }
})

app.post(HREF + '/userSiteLink/add', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }
  let {daily_site_name, site_day_date, guess_count, correct} = req.body
  if(!daily_site_name || !site_day_date || !guess_count || correct == null) {
    res.status(400).json({"error":"Required info missing"})
    return
  }
  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return
  }
  var loweredName = decodedToken.name

  let selectSql = 'SELECT * from user_site_link where daily_site_name = ? and site_day_date = ? and user_name = ?'
  let selectResult = await dbHelper.select(selectSql,[daily_site_name, site_day_date, loweredName],db)
  if(selectResult.err) {
    res.status(500).json({'error': 'Error while adding link'})
    return
  }
  if(selectResult.rows.length > 0) {
    let updateSql = 'UPDATE user_site_link set guess_count = ?, correct = ? WHERE daily_site_name = ? and site_day_date = ? and user_name = ?'
    let updateResult = await dbHelper.update(updateSql,[guess_count, correct, daily_site_name, site_day_date, loweredName],db)
    if(updateResult.err) {
      res.status(500).json({'error': 'Error while adding link'})
      return
    }
    res.status(200).json({'success':'Updated'})
    return
  } else {
    let insertSql = 'INSERT into user_site_link (user_name, daily_site_name, site_day_date, guess_count, correct) values (?,?,?,?,?)'
    let insertResult = await dbHelper.insert(insertSql, [loweredName,daily_site_name,site_day_date,guess_count,correct], db)
    if(insertResult.err) {
      res.status(500).json({'error': 'Error while adding link'})
      return
    }
    res.status(200).json({'success':'added'})
    return
  }
})

app.get(HREF + '/users/game', async (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return
  }

  let sql = 'SELECT * from user_game_link join game on game.name == user_game_link.game_name'
  let params = req.query
  if(params) {
    //console.log(params)
    let whereClauses = []
    if(params.users) {
      let users = params.users.split(',')
      whereClauses.push(`user_name in (${users.map((item)=> {
        return `'${item}'`
      })})`)
    }
    if(params.games) {
      let games = params.games.split(',')
      whereClauses.push(`game_name in (${games.map((item)=> {
        return `'${item}'`
      })})`)
    }
    if(params.playerCount && params.playerCount != 0) {
      whereClauses.push(`player_min <= ${params.playerCount} and player_max >= ${params.playerCount}`)
    }
    if(params.genre) {
      let genres = params.genre.split(',')
      whereClauses.push(`genre in (${genres.map((item) => {
        return `'${item}'`
      })})`)
    }
    if(params.installed) {
      whereClauses.push(`installed = ${params.installed}`)
    }

    var whereString = '';
    if(whereClauses.length > 0) {
      whereString = ' where '
      for (let i = 0; i < whereClauses.length; i++) {
        if(i != 0) {
          whereString += ' and '
        }
        whereString += whereClauses[i]
      }
    }
    
    let result = await dbHelper.select(sql + whereString,[],db)
    res.status(200).json(result.rows)
    return
  }
  let result = await dbHelper.select(sql,[],db)
  res.status(200).json(result.rows)
})



app.listen(process.env.PORT ? process.env.PORT : port, (err) => {
  if(err) {
    console.log(`error in server setup: ${err}`)
  }
  console.log("Server listening on Port",process.env.PORT ? process.env.PORT : port)
});
