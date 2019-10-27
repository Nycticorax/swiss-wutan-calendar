const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const {google} = require('googleapis')
const OAuth2 = google.auth.OAuth2
const calendar = google.calendar('v3')
const googleCredentials = require('./credentials.json')

/*const ERROR_RESPONSE = {
    status: "500",
    message:"Error updating calendar"
}
const TIME_ZONE = 'CEST'*/

function addEvent(event, auth){
    return new Promise((res, rej) => {
        calendar.events.insert({
            auth: auth,
            calendarId: 'nka6en8piao4l94h3njdl5e090@group.calendar.google.com',
            resource: event
        },(err, rej) => {
        if (err) {
            console.log('Rejecting because error')
            rej(err)
        }
        console.log('Request successful')
        res(res.data)
        })
    })
}

exports.acceptEvent = functions.firestore.document('swiss-wutan-events/{events}').onUpdate((change, context) => {
    let newVal = change.after.data()
    let oldVal = change.before.data()
    if (newVal.validation_status === 'accepted' && oldVal.validation_status === 'submitted') {
        const oAuth2Client = new OAuth2(
            googleCredentials.web.client_id,
            googleCredentials.web.client_secret,
            googleCredentials.web.redirect_uris[0]
        )
        oAuth2Client.setCredentials({
            refresh_token: googleCredentials.refresh_token
        })
        return addEvent(newVal, auth).then(res => console.log(res)).catch(err => console.log(err))
    }
})

