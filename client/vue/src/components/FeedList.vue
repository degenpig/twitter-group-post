<script>
import Tweet from "vue-tweet";
// Import component
import Loading from "vue3-loading-overlay";
// Import stylesheet
import "vue3-loading-overlay/dist/vue3-loading-overlay.css";

export default {
  components: {
    Tweet,
    Loading,
  },
  data() {
    return {
      tweetIdList: [],
      userName: "",
      isLoading: false,
    };
  },
  methods: {
    loadSuccess() {
      this.isLoading = false;
    },
    fetchList() {
      this.isLoading = true;
      fetch(`https://twitter.urkob.com/feed/${this.userName}`, {
        method: "get",
        headers: {
          "content-type": "application/json",
        },
      })
        .then(async (d) => {
          this.tweetIdList = await d.json();
        })
        .catch(async (e) => {
          console.error("fetchList: ", e);
          this.isLoading = false;
        });
    },
  },
};
</script>

<template>
  <div>
    <input v-model="userName" />
    <button @click="fetchList">Fetch list</button>
    <loading
      :active="isLoading"
      :can-cancel="true"
      :is-full-page="fullPage"
    ></loading>
    <div v-if="tweetIdList.length > 0">
      <div v-for="tweetId in tweetIdList" :key="tweetId">
        <Tweet :tweet-id="tweetId" v-on:tweet-load-success="loadSuccess" />
      </div>
    </div>
  </div>
</template>
