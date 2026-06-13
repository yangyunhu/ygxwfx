<template>
  <div class="app-container">
    <left-nav :collapsed="navCollapsed" @toggle="toggleSidebar"></left-nav>
    <div class="main-wrapper" :class="{ collapsed: navCollapsed }">
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
  data() {
    return {
      navCollapsed: false,
    };
  },
  mounted() {
    this.syncSidebarBodyClass();
  },
  beforeDestroy() {
    document.body.classList.remove("nav-sidebar-collapsed");
  },
  watch: {
    navCollapsed() {
      this.syncSidebarBodyClass();
    },
  },
  methods: {
    toggleSidebar() {
      this.navCollapsed = !this.navCollapsed;
    },
    syncSidebarBodyClass() {
      document.body.classList.toggle(
        "nav-sidebar-collapsed",
        this.navCollapsed,
      );
    },
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
  overflow-x: hidden;
  overflow-y: auto;
}

#app {
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  background-color: #f5f7fa;
  overflow: hidden;
}

.main-wrapper {
  flex: none;
  display: flex;
  flex-direction: column;
  margin-left: 280px;
  width: calc(100vw - 280px);
  min-width: 0;
  overflow: hidden;
}

.main-wrapper.collapsed {
  margin-left: 64px;
  width: calc(100vw - 64px);
}

.main-content {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: auto;
  padding: 20px;
  margin-top: 60px;
}

@media (max-width: 1200px) {
  .main-wrapper {
    margin-left: 64px;
    width: calc(100vw - 64px);
  }

  .main-wrapper.collapsed {
    margin-left: 64px;
    width: calc(100vw - 64px);
  }
}

@media (max-width: 860px) {
  .app-container {
    width: 100%;
  }

  .main-wrapper {
    margin-left: 0;
    width: 100%;
  }
}
</style>
