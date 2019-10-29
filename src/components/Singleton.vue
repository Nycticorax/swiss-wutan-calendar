<template>
  <v-content>
    <!-- NAV -->
    <v-card
      raised
      outlined
      dark
      style="position: fixed; right:0; margin:0; padding:0; z-index:9999"
    >
      <v-navigation-drawer v-model="nav" expand-on-hover permanent>
        <v-list-item>
          <v-list-item-title>NAV</v-list-item-title>
          <v-btn icon @click.stop="nav = !nav">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
        </v-list-item>
        <v-divider></v-divider>
        <v-list dense rounded>
          <v-list-item v-for="i in navItems" :key="i.name" link>
            <v-list-item-content>
              <v-list-item-title @click="$vuetify.goTo(i.target)">{{ i.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>
    </v-card>
    <v-content>
      <!-- INTRO -->
      <v-container>
        <v-card>
          <v-toolbar id="intro" flat color="red darken-2" dark>
            <v-toolbar-title>Introduction</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <p>
              The goal of this page is to demo a workable, in-house
              alternative to Facebook for managing Swiss Wutan's events. Reasons to go all-in with
              Facebook are (a) Facebook is the ultimate owner of the content it hosts (b) Facebook
              has a
              poor record in protecting users' privacy, (c) Facebook is extremely opaque and has poor
              programming interfaces and finally (d) it's always good not to put all one's eggs in the
              same basket, i.e. not assume everyone likes to use Facebook for managing
              community-driven time schedules. And if you still are in love with Facebook you can use
              <a
                href="https://www.facebook.com/help/152652248136178/"
              >these instructions</a> to
              export Facebook's events to Google Calendar.
            </p>
            <p>Onto the concept. It works like this.</p>
            <ol>
              <li>
                Anyone -- perhaps an individual or
                institutional member of Swiss Wutan, but not necessarily -- can submit events to
                the
                SWISS WUTAN CALENDAR -- displayed here below
              </li>
              <li>
                Submitted events don't need to be organized by Swiss Wutan or affiliates. They
                can just be interested for our community, or for some schools, etc. It's very
                easy with this setup to create different categories for events, and to search
                them smoothly.
              </li>
              <li>
                People vested with an
                "admin" role can accept or reject events submissions. This process is explained
                below.
              </li>
            </ol>At the end of the day this removes all the bureaucratic shenanigans so that we can all
            focus on what matters --
            <em>Wutan!</em> (For the curious, source code is sleeping
            <a
              href="https://github.com/Nycticorax/swiss-wutan-calendar"
            >here</a>.)
          </v-card-text>
        </v-card>
      </v-container>
      <v-container>
        <v-card>
          <v-toolbar id="auth" flat color="red darken-2" dark>
            <v-toolbar-title>Authenticate on Google Calendar</v-toolbar-title>
          </v-toolbar>
          <v-card class="d-flex pa-2" outlined tile>
            <v-card-actions>
            <div id="firebaseui-auth-container">
              <v-btn v-if="!authorized" @click="signIn()">Log in</v-btn>
              <v-btn v-else @click="signOut()">Log out</v-btn>
            </div>
            </v-card-actions>
            <v-card-text>
              Acquire admin credentials here. Please note that you will need a Google Account
              to make the most of this demo. Email + password login will be available.
            </v-card-text>
          </v-card>
        </v-card>
      </v-container>
      <v-container>
        <v-card>
          <v-toolbar id="manage" flat color="red darken-2" dark>
            <v-toolbar-title>Accept or reject events submissions</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            This section lets you switch between events submitted but not yet
            validated (i.e. accepted or rejected) and events already scheduled events.
          </v-card-text>
          <v-card class="d-flex pa-2" outlined tile>
            <v-tabs color="red darken-2" v-model="active_tab" vertical>
              <v-tab key="0">Submitted events</v-tab>
              <v-tab key="1">Scheduled events</v-tab>
              <!-- SUBMITTED EVENTS LIST -->
              <v-tab-item key="0">
                <v-card flat>
                  <div v-if="authorized">
                    <v-card-title>
                      <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
                    </v-card-title>
                    <v-data-table
                      v-if="submittedEvents"
                      v-model="selectedEvents"
                      :headers="submittedEvents_headers"
                      :items="submittedEvents"
                      show-select
                      sort-by="start.dateTime"
                      :sort-desc="true"
                      item-key="id"
                      :search="search"
                      :items-per-page="10"
                      class="elevation-1"
                    ></v-data-table>
                  </div>
                  <div v-else>
                    <v-card-text>You need to be logged in to see submitted events.</v-card-text>
                  </div>
                </v-card>
              </v-tab-item>
              <!-- CONFIRMED EVENTS LIST -->
              <v-tab-item key="1">
                <v-card flat>
                  <v-card-title>
                    <v-text-field v-model="search" label="Search" single-line hide-details></v-text-field>
                  </v-card-title>
                  <v-data-table
                    v-if="events"
                    v-model="selectedEvents"
                    :headers="events_headers"
                    :items="events"
                    show-select
                    :items-per-page="10"
                    class="elevation-1"
                    sort-by="start.dateTime"
                    :sort-desc="true"
                    item-key="local_id"
                    :search="search"
                  ></v-data-table>
                </v-card>
              </v-tab-item>
            </v-tabs>
          </v-card>
          <!-- ON DISPLAY -->
          <div id="subscribe" v-if="selectedEvents.length > 0">
            <v-divider></v-divider>
            <v-card v-for="se in selectedEvents" :key="se.id" class="mx-auto" tile>
              <v-card-title>{{se.summary}}</v-card-title>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>{{ se.author || "author" }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>{{se.start.dateTime | filtreDates }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>{{se.end.dateTime || "no end specified"}}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>{{se.location || "Wudan Mountains"}}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-card>
          </div>
          <!-- ACCEPT / REJECT -->
          <v-card-actions>
            <v-btn
              v-if="authorized && active_tab == 0 && selectedEvents.length > 0"
              @click="acceptSubmitted()"
            >Accept submitted event(s)</v-btn>
            <v-btn v-else-if="authorized" disabled>
              Accept submitted
              event(s)
            </v-btn>
            <v-btn
              v-if="authorized && active_tab == 0 && selectedEvents.length > 0"
              @click="rejecting = !rejecting"
            >
              Reject
              submitted event(s)
            </v-btn>
            <v-btn v-else-if="authorized" disabled>
              Reject submitted
              event(s)
            </v-btn>
          </v-card-actions>
        </v-card>
        <!-- REJECTING SUBMITTED EVENTS -->
      </v-container>
      <v-dialog v-if="rejecting" v-model="rejecting" persistent max-width="450">
        <v-card>
          <v-card-title class="headline">Explain why</v-card-title>
          <v-textarea
            v-model="rejecting_why"
            auto-grow
            placeholder="Please explain the submitter why you're rejecting."
            rows="4"
            row-height="30"
          ></v-textarea>
          <v-card-actions>
            <div class="flex-grow-1"></div>
            <v-btn color="green darken-1" text @click="rejecting = false; sendRejection()">
              Confirm &
              send
            </v-btn>
            <v-btn color="orange darken-1" text @click="rejecting = false">Cancel rejection</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-container>
        <v-card>
          <v-toolbar id="gCal" flat color="red darken-2" dark>
            <v-toolbar-title>Check out the legacy Google Calendar</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            This is the "official" interface Google provides for interacting with
            events. It is visible by
            anyone on
            the internet -- no credentials required. Events which are accepted using the form just above will show up there. Also, remember that Google Calendars have many
            features (independently of this very web app). The point of this web app is to provide a more fine-grained control over what gets in the Google Calendar, and to offer a better user interface.
            <p><v-btn @click="refreshFrame()">Reload</v-btn> if you've added new events to see them appear here.</p>
          </v-card-text>
          <v-card class="d-flex pa-2" outlined tile>
            <div :key="iframe_key">
              <iframe src="https://calendar.google.com/calendar/embed?height=500&amp;wkst=2&amp;bgcolor=%23D50000&amp;ctz=Europe%2FZurich&amp;src=bmthNmVuOHBpYW80bDk0aDNuamRsNWUwOTBAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&amp;color=%23D50000&amp;showTitle=1&amp;showNav=1&amp;showDate=1&amp;showPrint=0&amp;showCalendars=0&amp;showTz=0&amp;hl=en_GB" style="border-width:0" width="800" height="500" frameborder="0" scrolling="no"></iframe>
            </div>
          </v-card>
        </v-card>
      </v-container>
      <!-- CARROUSEL -->
      <v-container>
        <v-card>
          <v-toolbar id="carrou" flat color="red darken-2" dark>
            <v-toolbar-title>Browse events</v-toolbar-title>
          </v-toolbar>
          <v-card-text>A more confortable way of flipping through new events.</v-card-text>
        </v-card>
        <v-carousel cycle height="400" hide-delimiter-background show-arrows-on-hover>
          <v-carousel-item v-for="(e, i) in events" :key="i">
            <v-sheet height="100%" tile :color="colors[Math.floor(Math.random() * (5 - 0) + 0)]">
              <v-row class="fill-height" align="center" justify="center">
                <div class="display-3">
                  <p>{{e.summary}}</p>
                  <p>{{e.start.dateTime | filtreDates }}</p>
                  <p>{{e.location}}</p>
                </div>
              </v-row>
            </v-sheet>
          </v-carousel-item>
        </v-carousel>
      </v-container>
      <v-container>
        <!-- FORM -->
        <v-card>
          <v-toolbar id="submit" flat color="red darken-2" dark>
            <v-toolbar-title>Submit new events</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            By contrast to the other sections of the page, this one will be visible to anyone
            on the internet. People are supposed to use it to submit new events.
          </v-card-text>
          <v-card class="d-flex pa-2" outlined tile>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-container>
                <v-row>
                  <!-- SUBMITTER INFO -->
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="author.firstName"
                      :counter="25"
                      :rules="firstNameRules"
                      outlined
                      label="First name"
                      required
                    ></v-text-field>
                    <v-text-field
                      v-model="author.lastName"
                      :counter="25"
                      :rules="lastNameRules"
                      outlined
                      label="Last name"
                      required
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="author.email"
                      :rules="emailRules"
                      label="Email"
                      required
                      outlined
                    ></v-text-field>
                    <v-text-field
                      v-model="author.phone"
                      :rules="phoneRules"
                      label="Phone number"
                      required
                      outlined
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="4">
                    <v-checkbox
                      v-model="author.is_school"
                      color="red darken-2"
                      label="I am submitting on behalf of a Swiss Wutan school"
                    ></v-checkbox>
                    <v-select
                      v-if="author.is_school"
                      v-model="author.school"
                      :items="schools_opts"
                      label="School"
                      outlined
                      :rules="[v => !!v || 'Deselect the previous checkbox or please do mention your school']"
                      required
                    ></v-select>
                  </v-col>
                  <!-- DATES -->
                  <v-col cols="12" sm="6" class="my-2 px-1">
                    <v-date-picker
                      ref="picker"
                      v-model="dates"
                      multiple
                      color="red darken-2"
                      :picker-date.sync="pickerDate"
                      full-width
                    ></v-date-picker>
                  </v-col>
                  <v-col cols="12" sm="6" class="my-2 px-1">
                    <div class="title">Real calendar for all users (not only admins)</div>
                    <div class="subheader">Switch to October to see the scheduled events.</div>
                    <ul class="ma-4">
                      <li
                        v-for="e in thisMonthEvents"
                        :key="e.id"
                      >{{ e.summary }}{{ e.start.dateTime | filtreDates }}</li>
                    </ul>
                    <br />
                    <br />
                    <v-combobox
                      v-model="dates"
                      multiple
                      chips
                      :items="dates"
                      label="Dates picked"
                      deletable-chips
                    ></v-combobox>
                    <v-text-field label="Time" v-model="event.time" type="time"></v-text-field>
                  </v-col>
                  <!-- EVENT CONTENT -->
                  <v-col cols="12" md="6">
                    <v-text-field v-model="event.title" label="Event title" filled required></v-text-field>
                    <v-select
                      :items="levels_opts"
                      v-model="event.levels"
                      label="Suggested level(s)"
                      deletable-chips
                      multiple
                      chips
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field v-model="event.location" label="Event location" filled required></v-text-field>
                    <v-combobox
                      v-model="event.arts"
                      deletable-chips
                      multiple
                      chips
                      :items="arts_opts"
                      label="Featured styles"
                    ></v-combobox>
                  </v-col>
                  <!-- MORE CHECKBOXES -->
                  <v-col cols="12" md="6">
                    <v-combobox
                      v-model="event.topics"
                      multiple
                      chips
                      :items="topics_opts"
                      label="Topics"
                      deletable-chips
                    ></v-combobox>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-checkbox
                      v-model="event.privacy"
                      color="red darken-2"
                      label="This event is meant only for Swiss Wutan members"
                    ></v-checkbox>
                    <v-checkbox
                      v-model="event.registration"
                      color="red darken-2"
                      label="Registration required"
                    ></v-checkbox>
                    <div id="register" v-if="event.registration">
                      <v-combobox
                        v-model="event.registration_details"
                        :items="fillFromOpts"
                        filled
                        label="Participants register here (url, email):...."
                      ></v-combobox>
                    </div>
                    <v-checkbox
                      v-model="event.discount"
                      color="red darken-2"
                      label="Swiss Wutan members get a special discount"
                    ></v-checkbox>
                  </v-col>

                  <!-- COMMENTS -->
                  <v-container fluid>
                    <v-textarea
                      label="If appropriate please describe the event."
                      auto-grow
                      outlined
                      shaped
                      v-model="event.comments"
                    ></v-textarea>
                  </v-container>
                  <!-- SUBMIT -->
                  <v-btn
                    :disabled="!valid"
                    color="success"
                    class="mr-4"
                    @click="submitEvent()"
                  >Validate</v-btn>
                  <v-btn color="error" class="mr-4" @click="reset">Reset Form</v-btn>
                  <v-btn color="warning" @click="resetValidation">Reset Validation</v-btn>
                </v-row>
              </v-container>
            </v-form>
          </v-card>
        </v-card>
      </v-container>
      <!-- SUBSCRIBE -->
      <v-container>
        <v-card>
          <v-toolbar id="subscribe" flat color="red darken-2" dark>
            <v-toolbar-title>Subscribe</v-toolbar-title>
          </v-toolbar>
          <!-- <v-card-title></v-card-title> -->
          <v-card-text>
            You need to be logged in to use this feature. Here users can manage their
            subscriptions to 'topics', namely theme-related events
            about which they want to be notified. Notifications can be sent as emails or web push. Play
            around to see them in action.
          </v-card-text>
          <v-divider></v-divider>
          <v-form>
            <v-container>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-if="locked"
                    v-model="user.emailNotif"
                    readonly
                    outlined
                    filled
                    label="Email"
                    :placeholder="user.gUserEmail || user.emailNotif || ''"
                    @click:append-outer="lockUnlock"
                    append-outer-icon="mdi-lock-reset"
                  ></v-text-field>
                  <v-text-field
                    v-else
                    v-model="user.emailNotif"
                    outlined
                    label="Email"
                    :placeholder="user.gUserEmail || user.emailNotif || 'Your email'"
                    @click:append-outer="lockUnlock"
                    append-outer-icon="mdi-lock-reset"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-combobox
                    v-model="user.notifs_prefs"
                    :items="notifs_opts"
                    multiple
                    chips
                    deletable-chips
                    label="Notifications via"
                  ></v-combobox>
                  <v-combobox
                    v-model="user.reminders"
                    :items="reminders_opts"
                    multiple
                    chips
                    deletable-chips
                    label="Notifications when"
                  ></v-combobox>
                </v-col>
                <v-col cols="12" md="4">
                  <v-combobox
                    v-model="user.topics"
                    multiple
                    chips
                    :items="topics_opts"
                    label="Topics"
                    deletable-chips
                  ></v-combobox>
                  <v-btn class="ma-2" outlined text color="primary" @click="testEmail">Test email</v-btn>
                  <v-btn class="ma-2" outlined text color="primary" @click="testPush">
                    Test web
                    push
                  </v-btn>
                </v-col>
              </v-row>
              <v-btn
                v-if="authorized && user.emailNotif !== user.gUserEmail"
                color="success"
                @click="subUnsub(true)"
              >Subscribe</v-btn>
              <v-btn v-else disabled color="success">Already subscribed</v-btn>
              <v-btn
                v-if="authorized && user.emailNotif === user.gUserEmail"
                color="warning"
                @click="subUnsub(false)"
              >Edit subscription</v-btn>
              <v-btn v-else disabled color="error">Unsubscribe</v-btn>
            </v-container>
          </v-form>
        </v-card>
      </v-container>
    </v-content>
    <v-snackbar v-if="newNotif" v-model="notif_snackbar">
      {{ newNotif }}
      <v-btn color="pink" text @click="notif_snackbar = false">Close</v-btn>
    </v-snackbar>
    <v-snackbar v-if="newWebPush" v-model="push_snackbar" multi-line right color="primary">
      {{newWebPush}}
      <v-btn color="white" text @click="push_snackbar = false">Close</v-btn>
    </v-snackbar>
  </v-content>
</template>

<script>
const t0 = performance.now()

// GOOGLE FIREBASE CLIENT CREDENTIALS
const firebaseConfig = {
  apiKey: "AIzaSyBn9ur32UG9DkmN74HYciXzcp7uoJ2hwuU",
  authDomain: "main-repo.firebaseapp.com",
  databaseURL: "https://main-repo.firebaseio.com",
  projectId: "main-repo",
  storageBucket: "main-repo.appspot.com",
  messagingSenderId: "682912307930",
  appId: "1:682912307930:web:065128b1ab322a66",
  clientId:
    "682912307930-62gl7uo9mn743pphket25k7tf2buc3hc.apps.googleusercontent.com",
  discoveryDocs: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
  ],
  scopes: ["email", "profile", "https://www.googleapis.com/auth/calendar"]
}

firebase.initializeApp(firebaseConfig)

// FIRESTORE
const db = firebase.firestore()

// FUNCTIONS
const addEvent = firebase.functions().httpsCallable('addEvent')

// GOOGLE FIREBASE MESSAGING
const messaging = firebase.messaging()

export default {
  data() {
    return {
      // operational stuff
      api: undefined,
      authorized: false,
      accessToken: '',
      navItems: [
        { title: "Introduction", target: "#intro" },
        { title: "Authentication", target: "#auth" },
        { title: "Manage events", target: "#manage" },
        { title: "Google Calendar", target: "#gCal" },
        { title: "Event browser", target: "#carrou" },
        { title: "Submit new events", target: "#submit" },
        { title: "Subscribe to new events", target: "#subscribe" }
      ],
      nav: true,
      submittedEvents: [],
      pulledEvents: [],
      search: "",
      submittedEvents_headers: [
        { text: "Title", value: "summary", sortable: "true" },
        { text: "Submitted By", value: "submitted_by", sortable: "true" },
        { text: "Topics", value: "topics", sortable: "true" },
        { text: "Start", value: "start.dateTime", sortable: "true" },
        { text: "End", value: "end.dateTime" },
        { text: "Location", value: "location", sortable: "true" }
      ],
      events_headers: [
        { text: "Title", value: "summary", sortable: "true" },
        { text: "Start", value: "start.dateTime", sortable: "true" },
        { text: "End", value: "end.dateTime" },
        { text: "Location", value: "location", sortable: "true" }
      ],
      selectedEvents: [],
      active_tab: 1,
      rejecting: false,
      rejecting_why: "",
      iframe_key: 0,
      colors: ["primary", "secondary", "yellow darken-2", "red", "orange"],
      valid: true,
      firstNameRules: [
        v => !!v || "Name is required",
        v => (v && v.length <= 25) || "Name must be less than 10 characters"
      ],
      lastNameRules: [
        v => !!v || "Name is required",
        v => (v && v.length <= 25) || "Name must be less than 10 characters"
      ],
      emailRules: [
        v => !!v || "E-mail is required",
        v => /.+@.+\..+/.test(v) || "E-mail must be valid"
      ],
      phoneRules: [
        v => !!v || "Phone number is required",
        v =>
          /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im.test(
            v.trim()
          ) || "Phone number must be valid"
      ],
      schools_opts: [
        "Goju Kan Bern",
        "Wutan Thun",
        "Zenshin Basel",
        "Kungfu21",
        "Taekwondo Schule Basel",
        "Training Center Fribourg"
      ],
      // author
      dates: [],
      refDate: new Date().toISOString().substr(0, 10),
      pickerDate: null,
      author: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        is_school: null,
        school: ""
      },
      // event
      event: {
        title: "",
        location: "",
        start: "",
        end: "",
        time: "09:00",
        arts: ["Bagua", "Baji", "Tai chi"],
        levels: ["Beginners", "Advanced"],
        privacy: null,
        discount: null,
        registration: null,
        registration_details: "",
        comment: "",
        topics: ["Wutan Official", "CH Seminars", "TW Seminars"]
      },
      user: {
        topics: ["Wutan Official"],
        notifs_prefs: ["Email", "Web push"],
        reminders: ["added", "1 week before"],
        emailNotif: "",
        gUserEmail: "",
        name: "",
        token: ""
      },
      arts_opts: ["Bagua", "Baji", "Tai chi", "Kung Fu", "Mizongyi", "Xing Yi"],
      levels_opts: ["Beginners", "Advanced"],
      fillFrom_opts: ["fill from email", "fill from phone", "fill from school"],
      topics_opts: ["Wutan Official", "CH Seminars", "TW Seminars"],
      reminders_opts: [
        "added",
        "updated or cancelled",
        "1 week before",
        "2 days before"
      ],
      locked: false,
      notifs_opts: ["Email", "Web push"],
      notif_snackbar: false,
      push_snackbar: false,
      newNotif: "",
      newWebPush: ""
    }
  },

  created() {
    this.initMessaging()
    this.api = gapi
    this.listenAndLoad()
  },

  mounted() {
    console.log("Loaded in (sec)", performance.now() - t0)
  },

  computed: {
    events() {
      return this.pulledEvents.length > 0 ? this.pulledEvents : []
    },
    thisMonthEvents() {
      return this.events.filter(
        e => this.refDate.substr(0, 7) == e.start.dateTime.substr(0, 7)
      )
    },
    locker() {
      return this.locked ? "Unlock email address" : "Lock email address"
    },
    selectedSubmitted() {
      return this.selectedEvents.filter(e => e.validation_status === 'submitted')
    }
  },

  methods: {
    initMessaging() {
      messaging.usePublicVapidKey(
        "BJV_rKOrznrxId6JaxqYzlt7HcHjCK-c5S4062SL-dCqDtDkFs5fxifKdAtSyy3OIovPzhRC_O33reZbzBa1O6E"
      )
      messaging.onTokenRefresh(() => {
        messaging
          .getToken()
          .then(refreshedToken => {
            console.log("Token refreshed.")
            this.user.token = refreshedToken
            db.collection("swiss-wutan-subscribed")
              .doc(this.user.gUserEmail)
              .update({ push_token: refreshedToken })
          })
          .catch(err => {
            console.log("Unable to retrieve refreshed token ", err)
            showToken("Unable to retrieve refreshed token ", err)
          })
      })

      messaging.onMessage(payload => {
        this.newWebPush =
          "NEW NOTIFICATION. " +
          payload["notification"]["title"] +
          "\n" +
          payload["notification"]["body"]
      })
    },

    signIn() {
      const ui = new firebaseui.auth.AuthUI(firebase.auth())
      ui.start('#firebaseui-auth-container', {
        callbacks: {
          cb: (result, redirect) => {
            this.accessToken = result.credential.accessToken
            return true
          }
        },
        signInOptions: [
          // List of OAuth providers supported.
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          firebase.auth.TwitterAuthProvider.PROVIDER_ID,
        ],
        signInFlow: 'popup'
      })
    },

    signOut() {
      firebase.auth().signOut().then(() => {
        console.log('Signed out gracefully')
      }).catch(function(error) {
        console.error('Trying to sign out, then this error occurred', error)
      })
    },

    listenAndLoad() {
      firebase.auth().onAuthStateChanged(firebaseUser => {
        // Make sure there is a valid user object
        this.authorized = firebaseUser ? true : false
        if (this.authorized) {
          this.user.gUserEmail = firebaseUser.email
          this.user.name = firebaseUser.displayName
          this.newNotif = "Hi again, " + this.user.name
        }
        this.loadGapiClient()
      })
    },

    loadGapiClient() {
      this.api.load("client:auth2", this.initClient)
    },

    initClient() {
      let vm = this
      vm.api.client
        .init({
          apiKey: firebaseConfig.apiKey,
          clientId: firebaseConfig.clientId,
          discoveryDocs: firebaseConfig.discoveryDocs,
          scope: firebaseConfig.scopes.join(" ")
        })
        .then(() => {
          firebase.auth().currentUser.getIdToken()
          this.pullScheduled().then(events => {
            this.pulledEvents = events
            if (this.authorized) {
              this.updateUI(true)
              vm.api.client.setToken({access_token:this.accessToken.toString()})
            }
            else this.updateUI(false)
          })
        })
    },

    updateUI(is_authorized) {
      if (is_authorized) {
        this.pullSubmittedEvents().then(events => {
          this.submittedEvents = events
          this.authorized = true
          this.active_tab = 0
          let userRef = db
            .collection("swiss-wutan-subscribed")
            .doc(this.user.gUserEmail)
          userRef.get().then(doc => {
            if (!doc.exists)
              userRef.set({
                email: this.user.gUserEmail,
                created_on: firebase.firestore.FieldValue.serverTimestamp()
            })
            else {
              this.user.notifs_prefs = doc.data().notifs_prefs || []
              this.user.token = doc.data().token || ""
              this.user.emailNotif = this.user.gUserEmail
              this.user.topics = doc.data().topics || []
              this.user.reminders = doc.data().reminders || []
              this.locked = true
            }
          })
        })
      } else {
        this.submittedEvents = []
        this.authorized = false
        this.active_tab = 1
      }
      this.authorized = is_authorized
    },

    pullScheduled() {
      const vm = this
      return vm.api.client.calendar.events
        .list({
          calendarId: "nka6en8piao4l94h3njdl5e090@group.calendar.google.com",
          timeMin: new Date().toISOString(),
          showDeleted: false,
          singleEvents: true,
          maxResults: 10,
          orderBy: "startTime"
        })
        .then(response => {
          //console.log(response.result.items)
          return response.result.items.map(e => {
            let event = {
              local_id: Math.floor(Math.random() * Math.floor(1000)).toString(),
              validation_status: "accepted",
              summary: e.summary,
              description: e.description,
              location: e.location,
              start: { dateTime: e.start.dateTime || "" },
              end: { dateTime: e.end.dateTime || "" }
            }
            if ("attachments" in e) {
              event.attachments = [
                {
                  fileUrl: e.attachments[0].fileUrl || "",
                  title: e.attachments[0].title || "",
                  mimeType: e.attachments[0].mimeType || "",
                  iconLink: e.attachments[0].iconLink || "",
                  fileId: e.attachments[0].fileId || ""
                }
              ]
            }
            return event
          })
        })
    },

    // Pull submitted events from firestore
    pullSubmittedEvents() {
      return db
        .collection("swiss-wutan-events")
        .where("validation_status", "==", "submitted")
        .get()
        .then(snap => snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        .catch(err => console.log(JSON.stringify(err)))
    },

    // Accept or reject events
    acceptSubmitted() {
      let nb_events = this.selectedSubmitted.length
      Promise.all(this.selectedSubmitted.map(e => db.collection("swiss-wutan-events").doc(e.id).update({ validation_status: "accepted" })))
      .then(() => {
          //if (!gapi.auth2.getAuthInstance().isSignedIn.get()) { console.error('tried to push events, but not signed in!'); return}
          return Promise.all(this.selectedSubmitted.map(e => addEvent({event:e})))
          .then(res => {
            console.log(res)
            this.newNotif = nb_events.toString() + " event(s) accepted! Please *REFRESH* the page or *RELOAD* the Google Calendar below to see it/them."
          })
          .catch(err => {
            console.error("This went wrong", err)
            this.newNotif = "Something went wrong. Please get in touch."
          })
      })
    },

    getAttachment(i) {
      return "attachments" in this.events[i]
        ? this.events[i]["attachments"][0]["fileUrl"]
        : ""
    },

    sendRejection() {
      console.log("rejected")
    },

    // Little hack for iframe component refresh
    refreshFrame() {
      this.iframe_key += 1
    },

    // FIX ME : TALK TO DATABASE
    submitEvent() {
      if (this.$refs.form.validate()) {
        db.collection("swiss-wutan-events").add({
          summary: this.eventTitle,
          location: this.eventLocation,
          description: this.comments,
          start: {
            dateTime: this.eventStart,
            timeZone: "Europe/Zurich"
          },
          end: {
            dateTime: this.eventEnd,
            timeZone: "Europe/Zurich"
          },
          topics: this.topics,
          submitted_by: this.user.gUserEmail,
          validation_status: "submitted"
        })
        this.newNotif = "Event submitted!"
      } else {
        this.newNotif = "Please correct the form first."
      }
    },

    reset() {
      this.$refs.form.reset()
    },

    resetValidation() {
      this.$refs.form.resetValidation()
    },

    lockUnlock() {
      this.locked ? (this.locked = false) : (this.locked = true)
    },

    subUnsub(verdict) {
      let email = verdict ? this.user.emailNotif : this.user.gUserEmail
      db.collection("swiss-wutan-subscribed")
        .doc(this.user.gUserEmail)
        .update({
          notifs_prefs: this.user.notifs_prefs,
          email: email,
          topics: this.user.topics,
          reminders: this.user.reminders
        })
        .catch(err => (this.newNotif = "An error occurred " + err))
      this.newNotif = "Subscription edited!"
    },

    testEmail() {
      alert(
        "To test this feature, make sure you have registered to Wutan Official and are accepting notifications via emails. Then select the submitted event above, and click the ACCEPT SUBMITTED EVENT button."
      )
    },

    testPush() {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          // subsequent calls to getToken will return from cache.
          messaging
            .getToken()
            .then(currentToken => {
              if (currentToken) {
                db.collection("swiss-wutan-subscribed")
                  .doc(this.user.gUserEmail)
                  .update({ push_token: currentToken })
                setTimeout(() => {
                  this.sendPush(currentToken)
                }, 2000)
                alert(
                  "A notification will be issued after you close this window. Switch now to another tab or window to see the background notification. Or stay here to see the foreground notification."
                )
              } else {
                console.log(
                  "No Instance ID token available. Request permission to generate one."
                )
                console.log("Got this token", currentToken)
              }
            })
            .catch(err => {
              console.log("An error occurred while retrieving token. ", err)
              console.error("Error retrieving Instance ID token. ", err)
            })
        } else {
          console.log("Unable to get permission to notify.")
        }
      })
    },

    sendPush(token) {
      let key =
        "AAAAnwC-2to:APA91bG4Ehb9g8Gt7vjMyqO5-S5EL8XD0ZpJaEWXpHF6wm2AusPieTcSjfvO_ya6izP7cU5L0CWV1xs3eeS-rhg0TERFowF_0QZtyYLSzMfvdyM6NRQG9ncR-oUXHg_IpO1YuNttWtYN"
      let notification = {
        title: "You have the KUNG-FU!",
        body: "Yet, your journey is only beginning",
        click_action: "https://swiss-wutan-calendar-beta.netlify.com/"
      }

      fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          Authorization: "key=" + key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notification: notification,
          to: token
        })
      })
        .then(function(response) {
          console.log(response)
        })
        .catch(function(error) {
          console.error(error)
        })
    }
  },
  watch: {
    pickerDate(val) {
      this.refDate = val
    },
    newNotif(val) {
      this.notif_snackbar = true
    },
    newWebPush(val) {
      this.push_snackbar = true
    }
  },
  filters: {
    filtreDates(datetime) {
      datetime = datetime.split("T")
      let date = datetime[0],
        time = datetime[1]
      let amj = date.split("-")
      let a = amj[0],
        m = amj[1],
        j = amj[2]
      let hhmm = time.slice(0, 5)
      return j + "." + m + "." + a + " " + hhmm
    }
  }
}
</script>
