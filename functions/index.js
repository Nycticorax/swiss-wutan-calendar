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
            return Promise.all([sendEmail(res.emails, newData.summary), ...res.tokens.map(token => sendPush(token, newData.summary))])
        }).catch(err => console.error('Found error in notifySubscribed', err))
    } else return Promise.reject()

})

exports.getOrCreateUser = functions.https.onCall((data, context) => {
    let userRef = admin.firestore().collection('swiss-wutan-subscribed').doc(data.gUserEmail)
    return admin.firestore().collection('swiss-wutan-subscribed').doc(data.gUserEmail)
    .get()
    .then(doc => {
        if (doc.exists) return doc.data()
            else return userRef.set({ 'email': data.gUserEmail, 'created_on': admin.firestore.ServerValue.TIMESTAMP})
        })
})

exports.updateUserToken = functions.https.onCall((data, context) => {
    return admin.firestore().collection('swiss-wutan-subscribed').doc(data.gUserEmail)
    .update({ 'push_token': data.token })

})
exports.getSubmittedEvents = functions.https.onCall((data, context) => {
    return admin.firestore().collection('swiss-wutan-events').where("validation_status", "==", "submitted")
    .get()
    .then(snap => data.submittedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    .catch(err => console.log(JSON.stringify(err)))
})

exports.acceptSubmittedEvents = functions.https.onCall((data, context) => {
    return Promise.all(data.events_ids.map(id => admin.firestore().collection('swiss-wutan-events').doc(id)
        .update({ 'validation_status': 'accepted' })))
})

exports.updateUserDetails = functions.https.onCall((data, context) => {
    return admin.firestore().collection('swiss-wutan-subscribed').doc(data.gUserEmail)
    .update({ 'notifs_prefs':data.notifs_prefs, 'email': data.email, 'topics': data.topics })
})

exports.addCalendarEvent = functions.https.onCall((data, context) => {
	const gCalFields = ['status', 'updated', 'htmlLink', 'summary', 'description', 'location', 'start', 'end', 'organizer', 'creator', 'source', 'reminders']
	const sanitize = (event) => {
		for (let k in event) {
			if (!gCalFields.includes(k)) delete event[k]
		}
	return event
	}

	return Promise.all(data.events.map(e => {
			// FIX ME: check path to calendar object
			let r = api.client.calendar.events.insert({
				'calendarId': CALENDAR_ID,
				'resource': sanitize(e)
			})
			return r.execute()
	}))
})

exports.getCalendarEvents = functions.https.onCall((data, context) => {
    // FIX ME: check path to calendar object
	return api.client.calendar.events.list({
		'calendarId': CALENDAR_ID,
		'timeMin': (new Date()).toISOString(),
		'showDeleted': false,
		'singleEvents': true,
		'maxResults': 10,
		'orderBy': 'startTime'
	}).then(response => {
		return response.result.items.map(e => {
			return {
				'local_id': Math.floor(Math.random() * Math.floor(1000)).toString(),
				'validation_status': 'accepted',
				'summary': e.summary,
				'description': e.description,
				'location': e.location,
				'start': { 'dateTime': e.start.dateTime },
				'end': { 'dateTime:': e.end.dateTime }
			}
		})
	})
})
