<template>
  <div class="app-container">
    <left-nav></left-nav>
    <div class="main-wrapper">
      <header-component></header-component>
      <div class="main-content">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<script>
import LeftNav from "./components/LeftNav.vue";
import HeaderComponent from "./components/Header.vue";

export default {
  name: "App",
  components: {
    LeftNav,
    HeaderComponent,
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: #f5f7fa;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  margin-top: 60px;
}
</style>
