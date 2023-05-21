const nodemailer = require('nodemailer')

const sendMail = async (user, email) => {
 const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
   type: 'OAuth2',
   secure: true,
   user: user.email,
   clientId: user.clientId,
   clientSecret: user.clientSecret,
   refreshToken: user.refreshToken,
   accessToken: user.accessToken,

  }
 })

 const mail = {
  from: user.email,
  to: email.from,
  subject: email.subject,
  text: "In vacation",
  inReplyTo: email.messageId,
  references: [email.messageId] 
 }

 transporter.sendMail(mail, function (err, info) {
  if (err) {
   console.log(err)
  }
  else {
   console.log(info)
  }
  transporter.close();
 })

}

module.exports = sendMail
