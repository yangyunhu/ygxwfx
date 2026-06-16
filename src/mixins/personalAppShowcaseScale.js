/** 个人出勤 APP 原型 — 按容器宽度等比缩放，避免出现横向滚动条 */
export default {
  mounted() {
    this.$nextTick(() => {
      this.updateShowcaseScale();
      this._showcaseScaleHandler = () => this.updateShowcaseScale();
      window.addEventListener("resize", this._showcaseScaleHandler);
      const wrap = this.$el && this.$el.querySelector(".mockup-grid-wrap");
      if (wrap && typeof ResizeObserver !== "undefined") {
        this._showcaseResizeObserver = new ResizeObserver(this._showcaseScaleHandler);
        this._showcaseResizeObserver.observe(wrap);
      }
    });
  },
  beforeDestroy() {
    if (this._showcaseScaleHandler) {
      window.removeEventListener("resize", this._showcaseScaleHandler);
    }
    if (this._showcaseResizeObserver) {
      this._showcaseResizeObserver.disconnect();
    }
  },
  methods: {
    updateShowcaseScale() {
      const wrap = this.$el && this.$el.querySelector(".mockup-grid-wrap");
      const grid = wrap && wrap.querySelector(".mockup-grid");
      if (!wrap || !grid) return;

      grid.style.transform = "";
      wrap.style.height = "";

      const available = wrap.clientWidth;
      const natural = grid.scrollWidth;
      const scale = natural > 0 ? Math.min(1, available / natural) : 1;

      grid.style.transformOrigin = "top center";
      grid.style.transform = scale < 1 ? `scale(${scale})` : "";

      this.$nextTick(() => {
        const height = grid.getBoundingClientRect().height;
        wrap.style.height = `${height + 4}px`;
      });
    },
  },
};
