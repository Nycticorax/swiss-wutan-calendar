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
				// operational stuff
				api: undefined,
				authorized: false,
				events: [],
				submittedEvents: [],
				selectedSubmittedEvents: [],
				active_tab: 1,
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
					time: '',
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
				fillFrom_opts: ['fill from email', 'fill from phone', 'fill from school']
			}
		},

		created() {
			this.api = gapi;
			this.handleClientLoad();
		},

		computed: {
			thisMonthEvents() {
				return this.events.filter(e => this.refDate.substr(0, 7) == e.start.dateTime.substr(0, 7))
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
					// Determining Auth status
					this.setSigninStatus()
				})
			},

			updateSigninStatus(isSignedIn) {
				this.setSigninStatus()
			},

			setSigninStatus(isSignedIn) {
				let vm = this;
				let user = vm.api.auth2.getAuthInstance().currentUser.get();
				let isAuthorized = user.hasGrantedScopes(SCOPES);
				if (isAuthorized) this.setupdown(true)
				else this.setupdown(false)
			},

			setupdown(verdict) {
				if (verdict) {
					this.pullSubmitted()
					this.authorized = true;
					this.active_tab = 0
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
			// Accept or reject events
			validateEvents(verdict) {
				if (!verdict) {
					console.log('Denied!')
					return
				}

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

			// Pull proposed events (from Firebase eventually)
			pullSubmitted() {
				this.submittedEvents = [{
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
					this.events = events.map(e => {
						return {
							'summary': e.summary,
							'description': e.description,
							'location': e.location,
							'start': { 'dateTime': e.start.dateTime },
							'end': { 'dateTime:': e.end.dateTime }
						}
					})
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
		},
		watch: {
			pickerDate(val) {
				this.refDate = val
			},
		}
	});
}
