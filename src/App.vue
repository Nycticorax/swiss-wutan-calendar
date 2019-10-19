<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span class="font-weight-light">SWISS WUTAN CALENDAR</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
        <span class="mr-2">Beta version, feedback <a href="mailto:mrnycticorax@gmail.com">here</a>.</span>
    </v-app-bar>

    <v-content>
      <Singleton/>
    </v-content>
  </v-app>
</template>

<script>
import Singleton from './components/Singleton';

export default {
  name: 'App',
  components: {
    Singleton,
  },
  data: () => ({
    //
  }),
};
</script>
