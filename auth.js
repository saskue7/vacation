const passport = require('passport')

const GoogleStrategy = require('passport-google-oauth2').Strategy

require('dotenv').config()

passport.use(
 new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/auth/google/callback",
  passReqToCallback:true
  
 }, (request,accessToken,refreshToken, profile,done) => {
  console.log(profile.name)
  const user = {
   accessToken:accessToken,
   email: profile.email,
   name:profile.displayName,
   refreshToken:refreshToken,
   clientID: process.env.GOOGLE_CLIENT_ID,
   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
  done(null,user)
 }
 
 )
)

passport.serializeUser((user, done) => {
 done(null, user)
})

passport.deserializeUser((user, done) => {
 done(null, user)
})