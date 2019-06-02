const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jawas.saurabh@gmail.com',
        subject: 'Welcome !!! Thanks for joining in.. cheers.',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app`
    })
}

const sendGoodByeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'jawas.saurabh@gmail.com',
        subject: 'Goodbye !!! Sorry to see you go.',
        text: `Hey ${name}! We respect your decision to leave us. We will really appreciate if you could spare a few monents to let us know the reason for your decision `
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodByeEmail
}