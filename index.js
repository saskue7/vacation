const express = require('express')
const passport = require('passport')
require('dotenv').config()
require('./auth')

const session = require('express-session')
const app = express()
const axios = require('axios')
const sendMail = require('./nodemailer')
app.set('view engine', 'ejs')

app.use(session({
   secret: 'cats',
   cookie: {
      maxAge: 36000000,
   }
}))
app.use(passport.initialize())
app.use(passport.session())

// method if we have user
const authCheck = (req, res, next) => {
   if (!req.user) {
      res.redirect('/')
   } else {
      next()
   }
}



app.get("/", (req, res) => {
   res.render('pages/home')
})

app.get("/auth/google", passport.authenticate('google', {
   scope: ['https://www.googleapis.com/auth/plus.login',
      'https://www.googleapis.com/auth/userinfo.email', 'https://mail.google.com/']
}));

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
   res.redirect("/protected")
})

app.get("/protected", authCheck, (req, res) => {
   console.log("Welcome")
   res.render('pages/index', {
      data: req.user
   })
})

app.get("/process", authCheck, async (req, res) => {
   const data = await axios({
      method: 'get',
      url: `https://gmail.googleapis.com/gmail/v1/users/me/threads?q= after:2023/05/20 label:INBOX from:saskuejoshi@gmail.com`,
      headers: {
         Authorization: `Bearer ${req.user.accessToken}`
      }
   })

   if (data.data !== undefined) {
      const threads = data.data.threads
      console.log("You talking to me", threads)
      const emails = []
      threads.forEach(async (thread) => {
         let singleThread = await axios({
            method: 'get',
            url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`,
            headers: {
               Authorization: `Bearer ${req.user.accessToken}`
            }
         })

         let messages = singleThread.data.messages
         count = 0

         let singleHeader = messages[0].payload.headers
         // console.log(singleHeader)
         for (let j = 0; j < singleHeader.length; j++) {
            if (singleHeader[j].name === "From" && singleHeader[j].value === req.user.email) {
               console.log("hello")
               count = 1
               break
            }
         }
         

         console.log(count, thread.id)
         if (!count) {
            // console.log("yes",singleThread.data)
            console.log("yes")
            console.log(messages[0].headers)
            let left = []
            for (let i = 0; i < messages[0].headers; i++) {
               // console.log(messages)
               let singleHeader = messages[0].headers

               if (singleHeader[i].name === "From" || singleHeader[i].name === "Subject") {
                  console.log(singleHeader[i])
                  left.push(singleHeader[i].value)
               }
            }
            console.log(left)
            if (left.length > 0) { emails.push(left) }

         }
         else {
            console.log("count zero nhi  h iska", singleThread.data)
            await axios({
               method: 'post',
               url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}/modify`,
               headers: {
                  Authorization: `Bearer ${req.user.accessToken}`
               },
               data: {
                  addLabelIds: ["Label_1",],
                  removeLabelIds: ["INBOX",],
               }
            })
         }


      })
      console.log("hey this is running")
      console.log(emails)
      if (emails.length > 0) {
         for (let email in emails) {
            await axios({
               method: 'post',
               url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}/modify`,
               headers: {
                  Authorization: `Bearer ${req.user.accessToken}`
               },
               data: {
                  addLabelIds: ["Label_1",],
                  removeLabelIds: ["INBOX",],
               }
            })
            console.log(email)
            await sendMail(req.user, email)
         }
      }
   }


   res.redirect("/done")

})
app.get("/done", authCheck, (req, res) => {
   res.render('pages/done')
})


app.get('/logout', function (req, res) {
   req.session.destroy()
   res.send('logout')
}
);



const port = 5000
app.listen(port, () => {
   console.log('listening in port', port)
})