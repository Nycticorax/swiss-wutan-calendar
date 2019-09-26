// Client ID and API key from the Developer Console
const CLIENT_ID = '269173845983-bh57obunpvb47omgcbm6fq7nk3ube1mu.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBzpFzhzVLPaQBH3r0WVv9Jg9dDJnM15Hw';
// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/calendar';
const CALENDAR_ID = '3mo0a639qfhs9tjc1idmu4kkus@group.calendar.google.com'

window.onload = function () {
	new Vue({
		el: '#app',
		vuetify: new Vuetify(),
		data() {
			return {
				api: undefined,
				authorized: false,
				events: undefined,
				proposedEvents: undefined,
				active_tab: 0,
				iframe_key: 0,
				arrayEvents: null,
				date1: new Date().toISOString().substr(0, 10),
				date2: new Date().toISOString().substr(0, 10),
				// form
				valid: true,
				firstName: '',
				lastName: '',
				firstNameRules: [
					v => !!v || 'Name is required',
					v => (v && v.length <= 25) || 'Name must be less than 10 characters',
				],
				lastNameRules: [
					v => !!v || 'Name is required',
					v => (v && v.length <= 25) || 'Name must be less than 10 characters',
				],
				email: '',
				emailRules: [
					v => !!v || 'E-mail is required',
					v => /.+@.+\..+/.test(v) || 'E-mail must be valid',
				],
				phoneRules: [
					v => !!v || 'Phone number is required',
					v => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(v.trim()) || 'Phone number must be valid',
				],
				is_school: null,
				schoolName: '',
			}
		},

		created() {
			this.api = gapi;
			this.handleClientLoad();
		},

		mounted() {
			this.arrayEvents = [...Array(6)].map(() => {
				const day = Math.floor(Math.random() * 30)
				const d = new Date()
				d.setDate(day)
				return d.toISOString().substr(0, 10)
			})
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
					vm.api.auth2.getAuthInstance().isSignedIn.listen(vm.authorized);
				}).then(() => {
					this.pullScheduled()
					this.pullProposed()
				})
			},

			// Sign in
			handleAuthClick(event) {
				Promise.resolve(this.api.auth2.getAuthInstance().signIn())
					.then(_ => {
						this.authorized = true;
					});
			},

			// Sign out
			handleSignoutClick(event) {
				Promise.resolve(this.api.auth2.getAuthInstance().signOut())
					.then(_ => {
						this.authorized = false;
					});
			},
			// Accept or reject events
			validateEvents(verdict) {
				if (!verdict) {
					console.log('Denied!')
					return
				}

				let vm = this

				this.proposedEvents.forEach(e => {
					let r = vm.api.client.calendar.events.insert({
						'calendarId': CALENDAR_ID,
						'resource': e
					})
					r.execute((e) => {
						this.pullScheduled()
						this.proposedEvents = undefined
						this.active_tab = 1
					});
				});
			},

			// Pull proposed events (from Firebase eventually)
			pullProposed() {
				this.proposedEvents = [{
					'summary': 'Swiss Wutan Mock Event',
					'location': 'Wudang Mountains',
					'description': 'Running tests is boring but necessary',
					'start': {
						'dateTime': '2019-09-29T09:00:00-07:00',
						'timeZone': 'Europe/Zurich'
					},
					'end': {
						'dateTime': '2019-09-29T17:00:00-07:00',
						'timeZone': 'Europe/Zurich'
					}
				}]
			},

			// Fetch events from Calendar API
			pullScheduled() {
				let vm = this;

				vm.api.client.calendar.events.list({
					'calendarId': CALENDAR_ID,
					'timeMin': (new Date()).toISOString(),
					'showDeleted': false,
					'singleEvents': true,
					'maxResults': 10,
					'orderBy': 'startTime'
				}).then(response => {
					let events = response.result.items;
					let res = []
					if (events.length > 0) {
						for (i = 0; i < events.length; i++) {
							var event = events[i];
							var when = event.start.dateTime;
							if (!when) {
								when = event.start.date;
							}
							res.push(event.summary + ' (' + when + ')')
						}
					} else {
						res.push('No upcoming events found.');
					}
					this.events = res
				});

			},

			// Little hack for iframe component refresh
			refreshFrame() {
				this.iframe_key += 1;
			},

			// Form validation & reset
			validate() {
				if (this.$refs.form.validate()) {
					this.snackbar = true
				}
			},

			reset() {
				this.$refs.form.reset()
			},

			resetValidation() {
				this.$refs.form.resetValidation()
			},


		}
	});
}
