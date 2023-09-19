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
var TicTacToe = require("./TicTacToe.js")
var Stratego = require("./Stratego.js")
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


const CheckForTokenAndRespond = (req,res) => {
  if(!req.headers.authorization || !req.headers.authorization.split(' ')[1]) {
    res.status(401).json({"error":"token was not provided"})
    return {error:'token was not provided',success:false, name:''}
  }

  var decodedToken
  try{
    decodedToken = jwt.verify(req.headers.authorization.split(' ')[1], secret)
  } catch(error) {
    res.status(401).json({"error":"auth token has expired"})
    return {error:'auth token has expired',success:false, name:''}
  }
  var loweredName = decodedToken.name
  return {error:'',success:true, name:loweredName}
}


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
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }
  var loweredName = tokenResult.name

  var result = await dbHelper.select('SELECT name, guesses, correct_guesses, points, last_daily_guess, is_admin, public from user where name = ? LIMIT 1', [loweredName], db)
  if(result.err) {
    res.status(400).json({"error":"No User with this name exists"})
  } else {
    res.status(200).json(result.rows[0])
  }
})

app.get(HREF + '/users', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  var result = await dbHelper.select('SELECT name, guesses, correct_guesses, points, last_daily_guess, is_admin, public from user where public = 1', [], db)
  if(result.err) {
    res.status(400).json({"error":"No User with this name exists"})
  } else {
    res.status(200).json(result.rows)
  }
})

app.get(HREF + '/user/notification/preference', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }
  var loweredName = tokenResult.name

  let selectSQL = `select * from user_notification_preference where user_name = ?`
  let selectResult = await dbHelper.select(selectSQL,[loweredName],db)
  if(selectResult.err) {
    res.status(500).json({error:'error while getting notification preferences'})
    return
  }
  if(selectResult.rows.length == 0) {
    let insertSQL = `INSERT INTO user_notification_preference(user_name) values(?)`
    let insertResult = await dbHelper.insert(insertSQL,[loweredName],db)
    if(insertResult.err) {
      res.status(500).json({error:'error while getting notification preferences'})
      return
    }
    selectResult = await dbHelper.select(selectSQL,[loweredName],db)
    res.status(200).json({success:'sucess',rows:selectResult.rows})
    return
  }
  res.status(200).json({success:'sucess',rows:selectResult.rows})
  return
})

app.get(HREF + '/numberWins', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
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
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }
  var loweredName = tokenResult.name

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

app.post(HREF + '/user/update/social', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }
  var loweredName = tokenResult.name

  let {public} = req.body
  if(public == null) {
    res.status(400).json({"error":"Required update info missing"})
    return
  }

  let updateSQL = 'UPDATE user set public = ? where name = ?'
  let updateResult = await dbHelper.update(updateSQL,[public, loweredName],db)
  if(updateResult.err) {
    res.status(500).json({'error':'update failed'})
    return
  }
  res.status(200).json({'success':'user updated'})
})

app.post(HREF + '/user/update/notificationPreference', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }
  var loweredName = tokenResult.name
  let {daily_guess,tot_game} = req.body
  if(daily_guess == null && tot_game != null) {
    res.status(400).json({"error":"Required update info missing"})
    return
  }
  let updateSQL = 'UPDATE user_notification_preference set daily_guess = ?, tot_game = ? where user_name = ?'
  let updateResult = await dbHelper.update(updateSQL,[daily_guess, tot_game, loweredName],db)
  if(updateResult.err) {
    res.status(500).json({'error':'update failed'})
    return
  }
  res.status(200).json({'success':'user updated'})
})

//TODO: verify this method doesn't allow multiple subimsions form frontend
app.post(HREF + '/guess/:number', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  var loweredName = tokenResult.name

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

app.post(HREF + '/signup', async (req,res) => {
  let {name, password} = req.body
  if(!name || !password) {
    res.status(400).json({"error":"Sign up information not supplied in body"})
    return
  }
  var loweredName = name.toLowerCase()
  var encodedpassword = md5(password)
  var sql = 'INSERT INTO user (name, secret, guesses, correct_guesses, is_admin) VALUES (?,?,?,?, false)'
  var params = [loweredName, encodedpassword, 0, 0]
  let result = await dbHelper.insert(sql,params,db)
  if(result.err) {
    if(err.errno == 19) {
      res.status(400).json({"error":'User already exists'})
      return
    } else {
      res.status(500).json({"error":'Error when creating a new user'})
      return
    }
  }
  let insertSQL = `INSERT INTO user_notification_preferences(user_name) values(?)`
  let insertResult = await dbHelper.insert(insertSQL[loweredName],db)
  if(insertResult.err) {
    res.status(500).json({error:`Error when creating a new user's preferences`})
  }
  let token = jwt.sign({name: loweredName}, secret, {expiresIn: "5h"})
  res.status(200).json({"token":token})
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
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let sql = 'SELECT * from game'
  let gameResults = await dbHelper.select(sql, [], db)
  return res.status(200).json(gameResults.rows)
})

app.get(HREF + '/site', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let sql = 'SELECT * from daily_sites'
  let siteResults = await dbHelper.select(sql, [], db)
  return res.status(200).json(siteResults.rows)
})

app.get(HREF + '/request', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let params = req.query
  let getclosedsql = ''
  if(params && params.closed) {
    getclosedsql = ` where closed = ${params.closed}`
  }

  let sql = 'SELECT * from requests' + getclosedsql
  let selectResults = await dbHelper.select(sql, [], db)
  return res.status(200).json(selectResults.rows)
})

app.get(HREF + '/request/:userName', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  if(!req.params['userName']) {
    res.status(400).json({'error':'messing required info'})
    return
  }
  var userName = req.params['userName']

  let params = req.query
  let getclosedsql = ''
  if(params && params.closed) {
    getclosedsql = ` and closed = ${params.closed}`
  }

  let sql = `SELECT * from requests where user_name = ? ${getclosedsql}`
  let selectResults = await dbHelper.select(sql, [userName], db)
  return res.status(200).json(selectResults.rows)
})

app.get(HREF + '/request_messages', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let sql = 'SELECT * from request_message'
  let selectResults = await dbHelper.select(sql, [], db)
  return res.status(200).json(selectResults.rows)
})

app.get(HREF + '/request_messages/:id', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  if(!req.params['id']) {
    res.status(400).json({'error':'messing required info'})
    return
  }

  var id = req.params['id']

  let sql = `SELECT * from request_message where request_id = ?`
  let selectResults = await dbHelper.select(sql, [id], db)
  return res.status(200).json(selectResults.rows)
})

app.post(HREF + '/request_message/updateStatus', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {closed, id} = req.body
  if(closed == null, id == null) {
    res.status(400).json({"error":"Required update info missing"})
    return
  }

  let sql = 'UPDATE requests set closed = ? where id=?'
  let results = await dbHelper.update(sql,[closed,id],db);
  if(results.err) {
    res.status(500).json({'error':'Error updating request status'})
    return
  }
  res.status(200).json({'success':'Request status updated'})
  return
})

app.get(HREF + '/list/:userName', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  if(!req.params['userName']) {
    res.status(400).json({'error':'messing required info'})
    return
  }
  var userName = req.params['userName']

  let sql = `SELECT l.id, l.name, l.type, l.is_template, ull.user_name, ull.list_id, ull.is_owner from list l join user_list_link ull on l.id == ull.list_id where ull.user_name = ?`
  let selectResults = await dbHelper.select(sql, [userName], db)
  return res.status(200).json(selectResults.rows)
})

app.get(HREF + '/list/quickview/:id', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  if(!req.params['id']) {
    res.status(400).json({'error':'messing required info'})
    return
  }
  var id = req.params['id']

  let sql = `SELECT l.id,name,type,is_template,created_date, user_name, is_owner from list l join user_list_link ull on l.id == ull.list_id where l.id = ?`
  let selectResults = await dbHelper.select(sql, [id], db)
  if(selectResults.err) {
    res.status(500).json({'error':'failed to get data'})
    return
  } else {

    let data = selectResults.rows.reduce((accumulator,currentValue) => {
      if(accumulator.get(currentValue.id) == undefined) {
        accumulator.set(currentValue.id, {
          id:currentValue.id,
          name:currentValue.name,
          type:currentValue.type,
          is_template:currentValue.is_template,
          created_date:currentValue.created_date,
          user_names:[currentValue.user_name],
          items:[]})
        return accumulator;
      } else {
        let value = accumulator.get(currentValue.id)
        value.user_names = [...value.user_names, currentValue.user_name]
        accumulator.set(currentValue.id,value)
        return accumulator
      }
    },new Map())
    data = data.get(parseInt(id))

    if(data) {
      let itemSql = 'SELECT * from list_item where list_id = ?'
      let itemData = await dbHelper.select(itemSql,[id],db)
      data.items = itemData.rows
    }
    res.status(200).json(data)
    return
  }
})

app.get(HREF + '/userSiteLink', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let params = req.query
  console.log(params)
  if(params) {
    let whereClauses = []
    // if(params.date) {
    //   whereClauses.push(`site_day_date = '${params.date}'`)
    // }
    if(params.site) {
      whereClauses.push(`daily_site_name = '${params.site}'`)
    }
    if(params.userName) {
      whereClauses.push(`user_name = '${params.userName}'`)
    }
    if(params.spanDuration && params.span) {
      let startDate = params.date ? new Date(params.date) : new Date()
      whereClauses.push(`site_day_date <= '${dateHelper.GetYYYYMMDD(startDate)}'`)
      if(params.span == 'daily') {
        let dateObject = dateHelper.SubtractDays(startDate,1 * params.spanDuration)
        whereClauses.push(`site_day_date > '${dateHelper.GetYYYYMMDD(dateObject)}'`)
      }
      if(params.span == 'weekly') {
        let dateObject = dateHelper.SubtractDays(startDate,7 * params.spanDuration)
        whereClauses.push(`site_day_date > '${dateHelper.GetYYYYMMDD(dateObject)}'`)
      }
      if(params.span == 'monthly') {
        let dateObject = dateHelper.SubtractMonths(startDate,1 * params.spanDuration)
        whereClauses.push(`site_day_date > '${dateHelper.GetYYYYMMDD(dateObject)}'`)
      }
      if(params.span == 'yearly') {
        let dateObject = dateHelper.SubtractMonths(startDate,12 * params.spanDuration)
        whereClauses.push(`site_day_date > '${dateHelper.GetYYYYMMDD(dateObject)}'`)
      }

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
    console.log(selectSql + whereString)
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

app.get(HREF + '/totGame/overview/:userName', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let user_name = req.params['userName']
  if(!user_name) {
    res.status(400).json({'error':'messing required info'})
    return
  }

  var sqlTotGame = 'SELECT tg.*, utg.accepted, utg.is_creator from tot_game tg join user_tot_game utg on tg.id = utg.tot_id where utg.user_name = ?'
  var sqlTotGameParams = [user_name]
  let linkResults = await dbHelper.select(sqlTotGame,sqlTotGameParams,db)
  if(linkResults.err) {
    res.status(500).json({'error':'Error getting Tot games'})
    return
  }

  res.status(200).json(linkResults.rows)
  return
})

app.get(HREF + '/totGame/game', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }


  let id = req.query['id']
  let userName = req.query['userName']
  if(id == null || userName == null) {
    res.status(400).json({'error':'messing required info'})
    return
  }

  var sqlTotGame = 'SELECT tg.*, utg.accepted, utg.is_creator, utg.player_num from tot_game tg join user_tot_game utg on tg.id = utg.tot_id where tg.id = ? and utg.user_name = ?'
  var sqlTotGameParams = [id, userName]
  let linkResults = await dbHelper.select(sqlTotGame,sqlTotGameParams,db)
  if(linkResults.err) {
    res.status(500).json({'error':'Error getting Tot games'})
    return
  }
  res.status(200).json(linkResults.rows)
  return
})

app.post(HREF + '/totGame/add', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {type, challangedUser, creatorUser} = req.body
  if(!type || !challangedUser || !creatorUser) {
    res.status(400).json({"error":"Required Tot game info missing"})
    return
  }
  let gameJson = type == 'tic-tac-toe' ? TicTacToe.CreateTicTacToeGameState() : Stratego.CreateStrategoGameState()
  //TODO: Also get and store id in game_json
  let insertSQL = `INSERT INTO tot_game(type,users,game_json,status,winner) values(?,?,?,'pending','') returning id`
  let insertResult = await dbHelper.insertAndGet(insertSQL, [type,`'${creatorUser},${challangedUser}'`, JSON.stringify(gameJson)], db)
  if(insertResult.err) {
    res.status(500).json({'error':'Error creating tot game'})
    return
  }
  let totGameId = insertResult.rows.id;
  let linkInsertSQL = `INSERT INTO user_tot_game(user_name,tot_id,accepted,is_creator,player_num) values(?,?,?,?,?)`
  let linkOneResult = await dbHelper.insert(linkInsertSQL, [creatorUser,totGameId,true,true,1], db)
  let linkTwoResult = await dbHelper.insert(linkInsertSQL, [challangedUser,totGameId,false,false,2], db)
  if(linkOneResult.err || linkTwoResult.err) {
    res.status(500).json({'error':'Error creating tot game'})
    return
  }
  res.status(200).json({'success':'Tot game created', 'id':totGameId})
  return
})

app.post(HREF + '/totGame/accept', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {tot_id, userName} = req.body
  if(!tot_id || !userName) {
    res.status(400).json({"error":"Required Tot game info missing"})
    return
  }

  let updateLinkSQL = `UPDATE user_tot_game set accepted = 1 where tot_id = ? and user_name = ?`
  let insertLinkResult = await dbHelper.update(updateLinkSQL, [tot_id, userName], db)
  let updateTotGameSQL = `UPDATE tot_game set status = 'accepted' where id = ?`
  let insertTotGameResult = await dbHelper.update(updateTotGameSQL, [tot_id], db)
  if(insertLinkResult.err || insertTotGameResult.err) {
    res.status(500).json({'error':'Error accetping tot game'})
    return
  }
  res.status(200).json({'success':'Tot game updated'})
})

app.post(HREF + '/totGame/delete/:id', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  if(!req.params['id']) {
    res.status(400).json({'error':'messing required info'})
    return
  }

  var id = req.params['id']
  var sqlDeleteTotGameLink = 'DELETE FROM user_tot_game where tot_id = ?'
  let linkDelete = await dbHelper.delete(sqlDeleteTotGameLink,[id], db)
  var sqlDeleteTotGame = 'DELETE FROM tot_game where id = ?'
  let totGameDelete = await dbHelper.delete(sqlDeleteTotGame,[id], db)
  if(linkDelete.err || totGameDelete.err) {
    res.status(500).json({'error':'Error deleting tot games'})
    return
  }
  res.status(200).json({'sucess':'tot game deleted'})
})

app.post(HREF + '/list/add', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {name, type, is_template, user_name, user_names} = req.body
  if(!name || !type || is_template == null || ! user_name || user_names == null) {
    res.status(400).json({"error":"Required list info missing"})
    return
  }

  let sql = 'INSERT INTO list (name, type, is_template) values(?,?,?) RETURNING id'
  let results = await dbHelper.insertAndGet(sql,[name,type,is_template],db);
  if(results.err) {
    res.status(500).json({'error':'Error creating list'})
    return
  }

  var sqlUserListLink = 'INSERT INTO user_list_link(user_name,list_id, is_owner) Values (?,?,?)'
  var sqlUserLinstLinkParams = [user_name,results.rows.id,1]
  if(user_names && user_names.length > 0) {
    user_names.forEach((item) => {
      sqlUserListLink += ',(?,?,?)'
      sqlUserLinstLinkParams = [...sqlUserLinstLinkParams,item,results.rows.id,0]
    })
  }
  let linkResults = await dbHelper.insertAndGet(sqlUserListLink,sqlUserLinstLinkParams,db)
  if(linkResults.err) {
    res.status(500).json({'error':'Error setting users for list'})
    return
  }

  res.status(200).json({'success':'List created', 'id':results.rows.id})
  return
})

app.post(HREF + '/list/addTemplate', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {template_id, list_id} = req.body
  if(list_id == null || template_id == null) {
    res.status(400).json({"error":"Required list info missing"})
    return
  }
  let insertSQL = `INSERT INTO list_item (name,count,list_id) select name,count,? as 'list_id' from list_item where list_id = ?`
  insertResults = dbHelper.insert(insertSQL,[list_id,template_id],db)
  if(insertResults.err) {
    res.status(500).json({'error':'Error adding template items'})
    return
  }
  res.status(200).json({'success':'Template items added'})
})

app.post(HREF + '/list/delete', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {id} = req.body
  if(!id) {
    res.status(400).json({"error":"Required list info missing"})
    return
  }

  let deleteItemsSQL = 'delete from list_item where list_id = ?'
  let deleteItemResult = dbHelper.delete(deleteItemsSQL,[id],db)
  if(deleteItemResult.err) {
    res.status(500).json({"error":"error deleting list"})
    return
  }

  let deleteSQL = 'delete from list where id=?'
  let deleteResult = await dbHelper.delete(deleteSQL,[id],db)
  if(deleteResult.err) {
    res.status(500).json({"error":"error deleting list"})
    return
  }
  res.status(200).json({'success':'list deleted'})
  return
})

app.post(HREF + '/listItem/add', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {list_id, name, count} = req.body
  if(!name || list_id == null || !count) {
    res.status(400).json({"error":"Required list item info missing"})
    return
  }

  let insertSQL = 'insert into list_item (list_id,name,count) values (?,?,?) RETURNING id'
  let insertResults = await dbHelper.insertAndGet(insertSQL,[list_id,name,count],db)
  if(insertResults.err) {
    res.status(500).json({"error":"error adding item"})
    return
  }
  res.status(200).json({'success':'list item created','id':insertResults.rows.id})
})

app.post(HREF + '/listItem/delete', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {id} = req.body
  if(!id) {
    res.status(400).json({"error":"Required list item info missing"})
    return
  }

  let deleteSQL = 'delete from list_item where id=?'
  let deleteResult = await dbHelper.delete(deleteSQL,[id],db)
  if(deleteResult.err) {
    res.status(500).json({"error":"error deleting item"})
    return
  }
  res.status(200).json({'success':'list item deleted'})
  return
})

app.post(HREF + '/game/add', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
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
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
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
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
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

app.post(HREF + '/request/add', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {type, message, user_name} = req.body
  if(!type || !message || !user_name) {
    res.status(400).json({"error":"Required requests info missing"})
    return
  }

  let sql = 'INSERT INTO requests (type, message, user_name) values(?,?,?) RETURNING id'
  let results = await dbHelper.insertAndGet(sql,[type,message,user_name],db);
  if(results.err) {
    res.status(500).json({'error':'Error creating request'})
    return
  }
  res.status(200).json({'success':'Request created', id:results.rows.id})
  return
})

app.post(HREF + '/requestMessage/add', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {id, message, user_name} = req.body
  if(id == null || !message || !user_name) {
    res.status(400).json({"error":"Required requests info missing"})
    return
  }

  let sql = 'INSERT INTO request_message (request_id, message, user_name) values(?,?,?)'
  let results = await dbHelper.insert(sql,[id,message,user_name],db);
  if(results.err) {
    res.status(500).json({'error':'Error creating request message'})
    return
  }
  res.status(200).json({'success':'Request message created'})
  return
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
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let sql = 'SELECT * from user_game_link join game on game.name == user_game_link.game_name'
  let params = req.query
  if(params) {
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

app.post(HREF + '/totGame/action', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {action, id} = req.body
  if(!action && id != null) {
    res.status(400).json({"error":"Required info missing"})
    return
  }

  let getGameStateSQL = `SELECT * FROM tot_game where id = ?`
  let gameStateResult =  await dbHelper.select(getGameStateSQL, [id], db)
  if(gameStateResult.err) {
    return 'error'
  }
  let gameState = JSON.parse(gameStateResult.rows[0].game_json);
  gameState.game_id = id
  var result = '{"error":"Error running command"}';
  if(gameState.type == 'tic-tac-toe') {
    result = await TicTacToe.HandleTicTacToeAction(action, gameState, db, dbHelper)
  } else if (gameState.type == 'stratego') {
    result = await Stratego.HandleStrategoAction(action, gameState, db, dbHelper)
  }
  if(result == "error") {
    res.status(500).json({"error":"error handleing action"})
  }
  res.status(200).json(result)
  return
})

app.get(HREF + '/highscore', async (req,res) => {
  let {game, date, limit} = req.query
  if(!game) {
    res.status(400).json({"error":"Required info missing"})
    return
  }

  let getSQL = `Select * from high_scores where game = ? order by score desc LIMIT ${limit ? limit : 10}`
  let getResult = await dbHelper.select(getSQL, [game], db)
  if(getResult.err) {
    res.status(500).json({'error':'Error getting data','data':[]})
    return
  }
  res.status(200).json({'success':'Success','data':getResult.rows})
  return
})

app.post(HREF + '/highscore/submit', async (req,res) => {
  let {game, score, userName, password} = req.body
  if(!game || !score || !userName || !password) {
    res.status(400).json({"error":"Required info missing"})
    return
  }

  let loweredName = userName.toLowerCase()
  var encodedpassword = md5(password)
  let selectResult = await dbHelper.select('SELECT * from user where name = ? and secret = ? LIMIT 1', [loweredName, encodedpassword],db)
  if(selectResult.err) {
    res.status(500).json({"error":"Error on server when verifying user"})
    return
  }
  if(!selectResult.rows || selectResult.rows.length == 0) {
    res.status(400).json({"error":"No user with specified user name and password"})
    return
  }
  let user = selectResult.rows[0]
  let getHighScoreSQL = `Select * from high_scores where user_name = ?`
  let getHighScoreResult = await dbHelper.select(getHighScoreSQL,[user.name],db)
  if(getHighScoreResult.err) {
    res.status(500).json({"error":"Error on server when verifying user"})
    return
  }
  if(!getHighScoreResult.rows || getHighScoreResult.rows.length == 0) {
    let insertSQL = `insert into high_scores(game,user_name,score,display_name) values(?,?,?,?)`
    let insertResult = await dbHelper.insert(insertSQL,[game,user.name,score,user.name],db)
    if(insertResult.err) {
      res.status(500).json({error:'Error on server when creating record'})
      return
    }
    res.status(200).json({success:'Score created'})
    return
  } else {
    if(score > getHighScoreResult.rows[0].score) {
      let updateSQL = `update high_scores set score = ? where id = ?`
      let updateResult = await dbHelper.update(updateSQL,[score,getHighScoreResult.rows[0].id],db)
      if(updateResult.err) {
        res.status(500).json({error:'Error on server when updating record'})
        return
      }
      res.status(200).json({success:'Score updated'})
      return
    } else {
      res.status(200).json({success:'No update, higher score already exists'})
      return
    }
  }
})

app.get(HREF + '/notifications', async (req,res) => {
  let tokenResult = CheckForTokenAndRespond(req,res);
  if(!tokenResult.success) {
    return
  }

  let {userName} = req.query
  if(!userName) {
    res.status(400).json({"error":"Required info missing"})
    return
  }

  let selectSQL = `select * from user u join user_notification_preference unp on u.name = unp.user_name where user_name = ?`
  let selectResult = await dbHelper.select(selectSQL,[userName],db)
  if(selectResult.err) {
    res.status(500).json({error:'error while getting notification settings'})
    return
  }
  if(!selectResult || selectResult.rows.length == 0) {
    res.status(200).json({success:"No settings for user", rows:[]})
    return
  }
  let NotificationList = []
  let preferences = selectResult.rows[0]
  if(preferences.daily_guess) {
    const lastGuessDate = new Date(preferences.last_daily_guess + 'Z')
    const currentDate = new Date()
    if(lastGuessDate.getUTCDate() != currentDate.getUTCDate() ||
      lastGuessDate.getUTCMonth() != currentDate.getUTCMonth()) {
        NotificationList.push({type:'Daily Guess',message:'Your daily guess is available',link:'/game/dailyGuess'})
    }
  }
  if(preferences.tot_game) {
    let totGameSelect = `Select * from tot_game tg join user_tot_game utg on tg.id = utg.tot_id where utg.user_name = ?`
    let totGameResult = await dbHelper.select(totGameSelect,[userName],db)
    if(totGameResult.err) {
      res.status(500).json({'error':'error while getting notifications'})
      return
    }
    totGameResult.rows.forEach(element => {
      if(!element.accepted) {
        NotificationList.push({type:'Tot game challage',message:`You have been challanged to a ${element.type} game.`,link:`/game/totGames`})
      }
      if(element.status == 'accepted' && (element.current_player == element.player_num || element.current_player == 0)) {
        NotificationList.push({type:'Tot game turn',message:`It is your turn in a ${element.type} game`,link:`/game/totGames/game?id=${element.tot_id}`})
      }
    });
  }
  if(preferences.daily_quiz_results) {
    // let resultsSelect = ``
    // let resultsResults = await dbHelper.select(resultsSelect,[],db)
  }
  res.status(200).json({success:'notifications found', rows:NotificationList})
  return
})

app.listen(process.env.PORT ? process.env.PORT : port, (err) => {
  if(err) {
    console.log(`error in server setup: ${err}`)
  }
  console.log("Server listening on Port",process.env.PORT ? process.env.PORT : port)
});
