const t0 = performance.now()

/* GOOGLE APIs CLIENT CREDENTIALS */
const CLIENT_ID = '269173845983-bh57obunpvb47omgcbm6fq7nk3ube1mu.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBzpFzhzVLPaQBH3r0WVv9Jg9dDJnM15Hw';
// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/calendar'//, 'https://www.googleapis.com/auth/cloud-platform'];
const CALENDAR_ID = '3mo0a639qfhs9tjc1idmu4kkus@group.calendar.google.com'

/* GOOGLE FIREBASE CLIENT CREDENTIALS */
const firebaseConfig = {
	apiKey: "AIzaSyBn9ur32UG9DkmN74HYciXzcp7uoJ2hwuU",
	authDomain: "main-repo.firebaseapp.com",
	databaseURL: "https://main-repo.firebaseio.com",
	projectId: "main-repo",
	storageBucket: "main-repo.appspot.com",
	messagingSenderId: "682912307930",
	appId: "1:682912307930:web:065128b1ab322a66"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore()

/* GOOGLE FIREBASE MESSAGING */
const messaging = firebase.messaging()

window.onload = function () {
	new Vue({
		el: '#app',
		vuetify: new Vuetify(),
		data() {
			return {
				// operational stuff
				api: undefined,
				gUserEmail: '',
				token: '',
				authorized: false,
				navItems: [{ title: 'Introduction', target: '#intro' }, { title: 'Authentication', target: '#auth' }, { title: 'Manage events', target: '#manage' }, { title: 'Google Calendar', target: '#gCal' }, { title: 'Submit new events', target: '#submit' }, { title: 'Subscribe to new events', target: '#subscribe' }],
				nav: true,
				events: [],
				submittedEvents: [],
				events_headers: [
					{ text: 'Title', value: 'summary', sortable: 'true' },
					{ text: 'Submitted by', value: 'author', sortable: 'true' },
					{ text: 'Category', value: 'category', sortable: 'true' },
					{ text: 'Start', value: 'start.dateTime', sortable: 'true' },
					{ text: 'End', value: 'end.dateTime' },
				],
				search: '',
				submittedEvents_headers: [
					{ text: 'Title', value: 'summary', sortable: 'true' },
					{ text: 'Submitted By', value: 'submitted_by', sortable: 'true' },
					{ text: 'Category', value: 'category', sortable: 'true' },
					{ text: 'Start', value: 'start.dateTime', sortable: 'true' },
					{ text: 'End', value: 'end.dateTime' },
				],
				selectedEvents: [],
				active_tab: 1,
				rejecting: false,
				rejecting_why: '',
				iframe_key: 0,
				valid: true,
				firstNameRules: [
					v => !!v || 'Name is required',
					v => (v && v.length <= 25) || 'Name must be less than 10 characters',
				],
				lastNameRules: [
					v => !!v || 'Name is required',
					v => (v && v.length <= 25) || 'Name must be less than 10 characters',
				],
				emailRules: [
					v => !!v || 'E-mail is required',
					v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
				],
				phoneRules: [
					v => !!v || 'Phone number is required',
					v => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(v.trim()) || 'Phone number must be valid',
				],
				schools_opts: ['Goju Kan Bern', 'Wutan Thun', 'Zenshin Basel', 'Kungfu21', 'Taekwondo Schule Basel', 'Training Center Fribourg'],
				// author
				dates: [],
				refDate: new Date().toISOString().substr(0, 10),
				pickerDate: null,
				author: {
					firstName: '',
					lastName: '',
					email: '',
					phone: '',
					is_school: null,
					school: ''
				},
				// event
				event: {
					title: '',
					location: '',
					start: '2019-09-29T09:00:00-07:00',
					end: '2019-09-29T09:00:00-07:00',
					time: "09:00",
					arts: ['Bagua', 'Baji', 'Tai chi'],
					levels: ['Beginners', 'Advanced'],
					privacy: null,
					discount: null,
					registration: null,
					registration_details: '',
					comment: '',
				},
				arts_opts: ['Bagua', 'Baji', 'Tai chi', 'Kung Fu', 'Mizongyi', 'Xing Yi'],
				levels_opts: ['Beginners', 'Advanced'],
				fillFrom_opts: ['fill from email', 'fill from phone', 'fill from school'],
				emailNotif: '',
				topics_opts: ['Wutan Official', 'CH Seminars', 'TW Seminars'],
				topics: ['Wutan Official', 'CH Seminars', 'TW Seminars'],
				locked: false,
				notif_prefs: ['Email', 'Web push'],
				notifs_opts: ['Email', 'Web push'],
				snackbar: false,
				newNotif: '',
			}
		},

		created() {
			this.api = gapi;
			this.handleClientLoad()
			this.initMessaging()
		},

		mounted(){
			console.log('Loaded in (sec)',performance.now()-t0)
		},

		computed: {
			thisMonthEvents() {
				return this.events.filter(e => this.refDate.substr(0, 7) == e.start.dateTime.substr(0, 7))
			},
			locker() {
				return this.locked ? 'Unlock email address' : 'Lock email address'
			}
		},

		methods: {
			//On load, called to load the auth2 library and API client library.
			handleClientLoad() {
				this.api.load('client:auth2', this.initClient)
			},

			// Initializes the API client library and sets up sign-in state listeners.
			initClient() {
				let vm = this;

				vm.api.client.init({
					apiKey: API_KEY,
					clientId: CLIENT_ID,
					discoveryDocs: DISCOVERY_DOCS,
					scope: SCOPES
				}).then(_ => {
					// Listen for sign-in state changes.
					vm.api.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus)
					this.setSigninStatus()
				})
			},

			setSigninStatus(isSignedIn) {
				let vm = this;
				let googleAuth = vm.api.auth2.getAuthInstance()
				let currentUser = googleAuth.currentUser.get();

				// fetching en passant Google account email & modifying UI as appropriate
				this.gUserEmail = currentUser.getBasicProfile().getEmail()
				this.locked = true
				this.emailNotif = this.gUserEmail

				let isAuthorized = currentUser.hasGrantedScopes(SCOPES);
				if (isAuthorized) this.setupdown(true)
				else this.setupdown(false)

				// re-uses Google auth to manually log the user into Firebase
				let unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
					unsubscribe();
					
					if (firebaseUser) {
						let providerData = firebaseUser.providerData;
						for (let i = 0; i < providerData.length; i++) {
						  if (providerData[i].providerId === firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
							  providerData[i].uid === currentUser.getBasicProfile().getId()) {
								  return true;
						  }
						}
					  }

					let token = currentUser.getAuthResponse().id_token
					let credential = firebase.auth.GoogleAuthProvider.credential(token)

					// loggin into firebase & checking if user is already subscribed, responding as appropriate
					let userRef = db.collection('swiss-wutan-subscribed').doc(this.gUserEmail)
					return firebase.auth().signInWithCredential(credential)
						.catch(error => console.log(JSON.stringify(error)))
						.then(() => userRef.get())
						.then(doc => {
							if (!doc.exists) userRef.set({ 'email': this.gUserEmail, 'created_on': firebase.firestore.FieldValue.serverTimestamp() })
							else if (doc.data().notif_prefs) this.notif_prefs = doc.data().notif_prefs
						})
					//}
				})

			},

			initMessaging() {
				messaging.usePublicVapidKey("BJV_rKOrznrxId6JaxqYzlt7HcHjCK-c5S4062SL-dCqDtDkFs5fxifKdAtSyy3OIovPzhRC_O33reZbzBa1O6E");
				messaging.onTokenRefresh(() => {
					messaging.getToken().then((refreshedToken) => {
						console.log('Token refreshed.');
						db.collection('swiss-wutan-subscribed').doc(this.gUserEmail).update({ 'push_token': refreshedToken })
					}).catch((err) => {
						console.log('Unable to retrieve refreshed token ', err);
						showToken('Unable to retrieve refreshed token ', err);
					});
				});

				messaging.onMessage((payload) => {
					this.newNotif = payload['notification']['title'] + '\n' + payload['notification']['body']
					this.snackbar = true
				});

			},
			
			updateSigninStatus(isSignedIn) {
				this.setSigninStatus()
			},

			setupdown(verdict) {
				if (verdict) {
					this.pullSubmittedEvents().then(() => {
						this.authorized = true;
						this.active_tab = 0
					})
				} else {
					this.submittedEvents = []
					this.authorized = false;
					this.active_tab = 1
				}
				this.pullScheduled()
			},

			// Sign in
			handleAuthClick(event) {
				Promise.resolve(this.api.auth2.getAuthInstance().signIn())
					.then(_ => {
						this.setupdown(true)
					});
			},

			// Sign out
			handleSignoutClick(event) {
				Promise.resolve(this.api.auth2.getAuthInstance().signOut())
					.then(_ => {
						this.setupdown(false)
					});
			},


			// Pull submitted events from firestore
			pullSubmittedEvents() {
				return db.collection('swiss-wutan-submitted-events').get()
					.then(snap => this.submittedEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
					.catch(err => console.log(JSON.stringify(err)))
			},

			pushSubmittedEvents(accepted) {
				return db.collection('...')
			},

			// Accept or reject events
			validateEvents() {
				let vm = this

				this.submittedEvents.forEach(e => {
					let r = vm.api.client.calendar.events.insert({
						'calendarId': CALENDAR_ID,
						'resource': e
					})
					r.execute((e) => {
						this.pullScheduled()
						this.submittedEvents = []
						this.active_tab = 1
					});
				});
			},

			// Fetch events from Calendar API
			pullScheduled() {
				let vm = this;

				return vm.api.client.calendar.events.list({
					'calendarId': CALENDAR_ID,
					'timeMin': (new Date()).toISOString(),
					'showDeleted': false,
					'singleEvents': true,
					'maxResults': 10,
					'orderBy': 'startTime'
				}).then(response => {
					this.events = response.result.items.map(e => {
						return {
							'id': Math.floor(Math.random() * Math.floor(1000)).toString(),
							'summary': e.summary,
							'description': e.description,
							'location': e.location,
							'start': { 'dateTime': e.start.dateTime },
							'end': { 'dateTime:': e.end.dateTime }
						}
					})
				});

			},

			sendRejection() {
				console.log('rejected')
			},

			// Little hack for iframe component refresh
			refreshFrame() {
				this.iframe_key += 1;
			},

			// Form validation & reset
			validate() {
				if (this.$refs.form.validate()) {
					this.snackbar = true
					this.submittedEvents.push({
						'summary': this.eventTitle,
						'location': this.eventLocation,
						'description': this.comments,
						'start': {
							'dateTime': this.eventStart,
							'timeZone': 'Europe/Zurich'
						},
						'end': {
							'dateTime': this.eventEnd,
							'timeZone': 'Europe/Zurich'
						}
					})
				}
			},

			reset() {
				this.$refs.form.reset()
			},

			resetValidation() {
				this.$refs.form.resetValidation()
			},

			lockUnlock() {
				this.locked ? this.locked = false : this.locked = true
			},

			subUnsub(verdict) {
				let email = verdict ? this.emailNotif : this.gUserEmail
				db.collection('swiss-wutan-subscribed').doc(this.gUserEmail).update({
					'notif_prefs': this.notif_prefs,
					'email': email,
					'topics': this.topics
				})
			},

			testPush() {
				Notification.requestPermission().then((permission) => {
					if (permission === 'granted') {
						// subsequent calls to getToken will return from cache.
						messaging.getToken().then((currentToken) => {
							if (currentToken) {
								alert('A notification will be issued in 6 seconds. Switch now to another tab or window to see the background notification. Or stay here to see the foreground notification.')
								setTimeout(() => { this.sendPush(currentToken); }, 6000)								
								//return this.sendPush(currentToken)
							} else {
								console.log('No Instance ID token available. Request permission to generate one.');
								console.log('Got this token', currentToken)
							}
						}).catch((err) => {
							console.log('An error occurred while retrieving token. ', err);
							console.error('Error retrieving Instance ID token. ', err);
						});

					} else {
						console.log('Unable to get permission to notify.');
					}
				})
			},

			sendPush(token){
				let key = 'AAAAnwC-2to:APA91bG4Ehb9g8Gt7vjMyqO5-S5EL8XD0ZpJaEWXpHF6wm2AusPieTcSjfvO_ya6izP7cU5L0CWV1xs3eeS-rhg0TERFowF_0QZtyYLSzMfvdyM6NRQG9ncR-oUXHg_IpO1YuNttWtYN';
				let notification = {
					'title': 'You have the KUNG-FU!',
					'body': 'Yet, your journey is only beginning',
					'click_action': 'https://swiss-wutan-calendar-beta.netlify.com/'
				};

				fetch('https://fcm.googleapis.com/fcm/send', {
					'method': 'POST',
					'headers': {
						'Authorization': 'key=' + key,
						'Content-Type': 'application/json'
					},
					'body': JSON.stringify({
					'notification': notification,
					'to': token
					})
				}).then(function(response) {
					console.log(response);
				}).catch(function(error) {
					console.error(error);
				})
			
			},


		},
		watch: {
			pickerDate(val) {
				this.refDate = val
			},
		}
	});
}
