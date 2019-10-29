const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const nodemailer = require('nodemailer')
const {google} = require('googleapis')
const OAuth2 = google.auth.OAuth2
const calendar = google.calendar('v3')
const googleCredentials = require('./credentials.json')

function sanitizeEvent(event){
    const gCalFields = [
        "status",
        "updated",
        "gadget",
        "attachments",
        "htmlLink",
        "summary",
        "description",
        "location",
        "start",
        "end",
        "organizer",
        "creator",
        "source",
        "reminders"
    ]
    for (let k in event) {
        if (!gCalFields.includes(k)) delete event[k]
    }
    return event
}

function addEvent(event, auth){
    return new Promise((resolve, reject) => {
        calendar.events.insert({
            auth: auth,
            calendarId: 'nka6en8piao4l94h3njdl5e090@group.calendar.google.com',
            resource: event
        },(err, res) => {
        if (err) {
            console.log('Rejecting because error')
            console.log(err)
            reject(err)
        }
        console.log('Request successful', JSON.stringify(res))
        resolve(res)
        })
    })
}

function getConcerned(event_topics) {
    // returns emails & tokens of those whose topics intersect event_topics
    return admin.firestore().collection('swiss-wutan-subscribed').get()
        .then(snap => {
            let concerned = snap.docs.filter(doc => {
                let notifs_prefs = doc.data().notifs_prefs || null
                let topics = doc.data().topics || null
                if (notifs_prefs && topics && topics.length > 0 && notifs_prefs.length > 0 && event_topics.some(et => topics.includes(et))) {
                    return true
                }
            })
            let emails = concerned.filter(doc => doc.data().notifs_prefs.includes('Email') && doc.data().email).map(doc => doc.data().email)
            let tokens = concerned.filter(doc => doc.data().notifs_prefs.includes('Web push') && doc.data().push_token).map(doc => doc.data().push_token)
            return { emails: emails, tokens: tokens }
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
        subject: "New Swiss Wutan Event: " + summary, // Subject line
        text: 'Told you it worked. But you still had to try it out for yourself.',
        html: '<p>Told you it worked. But you still had to try it out for yourself.</p>'// plain text body
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
    // upon an event updated to 'accepted', sends emails and / or web push notifications to all whose topics intersect topics of the event
    const newData = change.after.data();
    const oldData = change.before.data();
    if (newData.validation_status === 'accepted' && oldData.validation_status === 'submitted') {
        return getConcerned(newData.topics).then(res => {
            return Promise.all(
                [
                    sendEmail(res.emails, newData.summary),
                    ...res.tokens.map(token => sendPush(token, newData.summary))
                ]
            )
        }).catch(err => console.error('Found error in notifySubscribed', err))
    } else return;

})

exports.addEvent = functions.https.onCall((data, context) => {
    // upon acceptance in client, adds data.event to Google Cal
    const oAuth2Client = new OAuth2(
        googleCredentials.web.client_id,
        googleCredentials.web.client_secret,
        googleCredentials.web.redirect_uris[0]
    )
    oAuth2Client.setCredentials({
        refresh_token: googleCredentials.refresh_token
    })
    return addEvent(sanitizeEvent(data.event), oAuth2Client)
    .then(res => 'Event successfully saved with this result ' + res)
    .catch(err => 'Insertion failed for this reason ' + err)
})