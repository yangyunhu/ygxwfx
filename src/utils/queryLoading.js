/**
 * 全局查询加载弹窗
 */
import Vue from "vue";
import QueryLoadingOverlay from "../components/QueryLoadingOverlay.vue";

const Overlay = Vue.extend(QueryLoadingOverlay);
let instance = null;
let showAt = 0;
let hideTimer = null;

/** 查询加载弹窗最短展示时长（毫秒） */
const DEFAULT_MIN_MS = 3000;

function getInstance() {
  if (!instance) {
    instance = new Overlay();
    instance.$mount(document.createElement("div"));
    document.body.appendChild(instance.$el);
  }
  return instance;
}

export function showQueryLoading(text = "正在查询...") {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
  const vm = getInstance();
  vm.text = text;
  vm.visible = true;
  showAt = Date.now();
}

export function hideQueryLoading(minDuration = DEFAULT_MIN_MS) {
  const vm = getInstance();
  const elapsed = Date.now() - showAt;
  const wait = Math.max(0, minDuration - elapsed);
  hideTimer = setTimeout(() => {
    vm.visible = false;
    hideTimer = null;
  }, wait);
}

/**
 * 执行查询任务并展示加载弹窗（支持同步 / Promise）
 * @param {Function} task
 * @param {{ text?: string, minDuration?: number }} options
 */
export function runQueryLoading(task, options = {}) {
  const { text = "正在查询...", minDuration = DEFAULT_MIN_MS } = options;
  showQueryLoading(text);

  return Promise.resolve()
    .then(() => task())
    .then((result) => {
      hideQueryLoading(minDuration);
      return result;
    })
    .catch((err) => {
      hideQueryLoading(minDuration);
      throw err;
    });
}

export default {
  showQueryLoading,
  hideQueryLoading,
  runQueryLoading,
};
