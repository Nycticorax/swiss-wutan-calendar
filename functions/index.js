const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer')

admin.initializeApp();

function getConcerned(event_topics) {
    // returns users whose topics intersect event_topics
    return admin.firestore().collection('swiss-wutan-subscribed').get()
        .then(snap => snap.docs
            .filter(doc => doc.data().topics && doc.data().topics
                .some(t => event_topics.includes(t) && doc.data().notifs_prefs.length > 0)))
}

function sendPush(addressee_token, summary) {
    const pushPayload = {
        webpush: {
            notification: {
                title: 'New event ',
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
        getConcerned(newData.topics).then(usersDocs => {
            let emails = usersDocs.map(userDoc => {
                if (userDoc.data().notifs_prefs.includes('Email')) return userDoc.data().email
            })
            let push_tokens = usersDocs.map(userDoc => {
                if (userDoc.data().notifs_prefs.includes('Web push') && userDoc.data().push_token) return userDoc.data().push_token
            })
            return Promise.all([sendEmail(emails, newData.summary), push_tokens.map(token => sendPush(token, newData.summary))])
        }).catch(err => console.error('Found error in notifySubscribed', err))
    } else return Promise.reject()

});