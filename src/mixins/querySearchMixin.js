/**
 * 自动为页面内标准查询方法包裹加载弹窗
 */
import { runQueryLoading } from "../utils/queryLoading";

export const QUERY_SEARCH_METHODS = [
  "handleSearch",
  "handleMonitorSearch",
  "handleCleanSearch",
  "handleModeSearch",
  "handleOutputSearch",
];

export default {
  created() {
    QUERY_SEARCH_METHODS.forEach((name) => {
      const original = this[name];
      if (typeof original !== "function" || original.__queryWrapped) return;

      const wrapped = function querySearchWrapped(...args) {
        if (args[0] && args[0].__querySilent) {
          return original.apply(this, args.slice(1));
        }
        return runQueryLoading(() => original.apply(this, args));
      };
      wrapped.__queryWrapped = true;
      this[name] = wrapped;
    });
  },
};
