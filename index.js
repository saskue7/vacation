const express = require('express')
const passport = require('passport')
const app = express()
require('./auth')
const session = require('express-session')
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

// methods
const authCheck = (req, res, next) => {
   if (!req.user) {
      res.redirect("/")
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
}))

app.get('/auth/google/callback', passport.authenticate('google'), (req, res) => {
   res.redirect("/profile")
})

app.get("/profile", authCheck, (req, res) => {
   console.log(req.user)
   res.render('pages/index', {
      data: req.user
   })
})

app.get("/process", authCheck, async (req, res) => {
   const data = await axios({
      method: "get",
      url: "https://gmail.googleapis.com/gmail/v1/users/me/threads?q= after:2023/05/20 from:ankitjoshi377@gmail.com",
      headers: {
         Authorization: `Bearer ${req.user.accessToken}`
      }
   })


   if (data.data.resultSizeEstimate) {
      //  process
      const threads = data.data.threads
      // console.log(threads)
      threads.forEach(async (thread) => {

         const singleThread = await axios({
            method: "get",
            url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}?`,
            headers: {
               Authorization: `Bearer ${req.user.accessToken}`
            }
         })

         // console.log(singleThread.data)
         flag = 0

         const messages = singleThread.data.messages
         if (messages.length > 2) { flag = 1 }
         else {
            console.log("hey")
            // console.log(messages[0])
            const headers = messages[0].payload.headers
            // console.log(messages[1].snippet)
            let left = {}
            // console.log(headers)
            for (let i = 0; i < headers.length; i++) {
               // if (headers[i].name === "To") {
               //  console.log(req.user.name + " " + "<" + req.user.email + ">")
               //  console.log(headers[i].value)
               // }
               if (headers[i].name === "From") {
                  let result = headers[i].value
                  result = result.split("<")[1]
                  result = result.split(">")[0]
                  left.from = result
               }
               if (headers[i].name === "Subject") {
                  left.subject = headers[i].value
               }
               if (headers[i].name === "Message-ID") {
                  left.messageId = headers[i].value
               }

            }

            await sendMail(req.user, left)

            // console.log(emails)
         }
         // adding labels ..
         await axios({
            method: "post",
            url: `https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}/modify`,
            headers: {
               Authorization: `Bearer ${req.user.accessToken}`
            },
            data: {
               addLabelIds: ["Label_1"],
               removeLabelIds: ["INBOX"]
            }
         })
      })







   }




   res.redirect("/done")
})

app.get('/done', authCheck, (Req, res) => {
   res.render('pages/done')
})

app.get('/logout', (req, res) => {
   req.session.destroy()
   res.redirect("/")
})

const port = 5000

app.listen(port, () => {
   console.log("server is running on", port)
})