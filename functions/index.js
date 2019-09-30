const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer')

admin.initializeApp();

function getConcerned(event_topics) {
    // returns emails & tokens of those whose topics intersect event_topics
    return admin.firestore().collection('swiss-wutan-subscribed').get()
    .then(snap => {
        let concerned = snap.docs.filter(doc => {
            let notifs_prefs = doc.data().notifs_prefs || null 
            let topics = doc.data().topics || null
            if (notifs_prefs && topics && topics.length>0 && notifs_prefs.length > 0 && event_topics.some(et => topics.includes(et))){
                return true
            }
        })
        let emails = concerned.filter(doc => doc.data().notifs_prefs.includes('Email') && doc.data().email).map(doc => doc.data().email)
        let tokens = concerned.filter(doc => doc.data().notifs_prefs.includes('Web push') && doc.data().push_token).map(doc => doc.data().push_token)
        return {emails:emails, tokens:tokens}
    })
}

function sendPush(addressee_token, summary) {
    const pushPayload = {
        webpush: {
            notification: {
                title: 'New event matching your topics on swiss-wutan-beta-calendar',
                body: summary.slice(0, 30),
                icon: 'https://static.thenounproject.com/png/78842-200.png',
            }
        },
        token: addressee_token,
    }
    return admin.messaging().send(pushPayload)

}

function sendEmail(addressees_emails, summary) {
    const gmailEmail = functions.config().gmail.email
    const gmailPassword = functions.config().gmail.password
    const mailOptions = {
        from: 'Adrien Glauser <mrnyticorax@gmail@gmail.com>', // sender address
        to: addressees_emails, // list of receivers
        subject: "New event: " + summary, // Subject line
        text: 'Told you it worked. But you still had to try it out for yourself.',
        html: '<p>But you still had to try it out for yourself.</p>'// plain text body
    }
    const mailTransport = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: gmailEmail,
            pass: gmailPassword,
        },
    })
    return mailTransport.sendMail(mailOptions)
}

exports.notifySubscribed = functions.firestore.document('swiss-wutan-events/{event}').onUpdate((change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    if (newData.validation_status === 'accepted' && oldData.validation_status === 'submitted') {
        return getConcerned(newData.topics).then(res => {
            return Promise.all([sendEmail(res.emails, newData.summary), ...res.tokens.map(token => sendPush(token, newData.summary))])
        }).catch(err => console.error('Found error in notifySubscribed', err))
    } else return Promise.reject()

});