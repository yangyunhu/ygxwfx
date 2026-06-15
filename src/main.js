import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import locale from 'element-ui/lib/locale/lang/zh-CN';
import App from './App.vue';
import router from './router';
import './styles.css';
import './styles/table-scroll.css';

Vue.use(ElementUI, { locale });

Vue.config.productionTip = false;

// ResizeObserver 与 ECharts resize 叠加时浏览器可能误报，开发环境屏蔽 overlay
if (process.env.NODE_ENV !== 'production') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('ResizeObserver loop')) {
      event.stopImmediatePropagation();
    }
  });
}

new Vue({
  router,
  render: h => h(App)
}).$mount('#app');
