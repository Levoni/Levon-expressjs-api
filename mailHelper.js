var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'LevonWillNotCheckThis@gmail.com',
    pass: process.env.gpassword
  }
});

var mailOptions = {
  from: 'LevonWillNotCheckThis@gmail.com',
  to: '',
  subject: 'Password',
  html: `<p>This is a password reset email for http://levonpersonalplayarea.com. Please reset your password with the following link.</p>
         <a href="http://levonpersonalplayarea.com/reset/password">Reset Link</a>`
};

module.exports = {
    SendMail: (toAddress, resetCode) => { 
        return new Promise((resolve,reject) =>{
            mailOptions.to = toAddress
            mailOptions.html = `<p>This is a password reset email for http://levonpersonalplayarea.com. Please reset your password with the following link.</p>
            <br>
            <br>
            <a href="http://levonpersonalplayarea.com/reset/password?resetCode=${resetCode}">Reset Link</a>`
            transporter.sendMail(mailOptions, function(error, info){
              if (error) {
                reject(error)
              } else {
                resolve("Email sent: ' + info.response")
              }
            })
        })
    }
}