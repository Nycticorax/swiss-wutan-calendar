const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

const {google} = require('googleapis')
const OAuth2 = google.auth.OAuth2
const calendar = google.calendar('v3')
const googleCredentials = require('./credentials.json')

const ERROR_RESPONSE = {
    status: "500",
    message:"Error updating calendar"
}
const TIME_ZONE = 'CEST'

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

exports.addEvent = functions.https.onCall((data, context) => {
    const oAuth2Client = new OAuth2(
        googleCredentials.web.client_id,
        googleCredentials.web.client_secret,
        googleCredentials.web.redirect_uris[0]
    )
    oAuth2Client.setCredentials({
        refresh_token: googleCredentials.refresh_token
    })
    addEvent(sanitizeEvent(data.event), oAuth2Client)
    .then(res => 'Event successfully saved with this result ' + res)
    .catch(err => 'Insertion failed for this reason ' + err)
})