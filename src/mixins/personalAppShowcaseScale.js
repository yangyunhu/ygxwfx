/** 个人出勤 APP 原型 — 等比缩放并居中，避免布局占位错位 */
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
      const scaler = wrap && wrap.querySelector(".mockup-grid-scaler");
      const grid = scaler && scaler.querySelector(".mockup-grid");
      if (!wrap || !scaler || !grid) return;

      grid.style.transform = "";
      grid.style.transformOrigin = "";
      scaler.style.width = "";
      scaler.style.height = "";
      wrap.style.minHeight = "";

      const available = wrap.clientWidth;
      const naturalWidth = grid.scrollWidth;
      const naturalHeight = grid.offsetHeight;
      if (!naturalWidth || !naturalHeight) return;

      const scale = Math.min(1, available / naturalWidth);

      if (scale < 1) {
        scaler.style.width = `${Math.ceil(naturalWidth * scale)}px`;
        scaler.style.height = `${Math.ceil(naturalHeight * scale)}px`;
        grid.style.transformOrigin = "top left";
        grid.style.transform = `scale(${scale})`;
      }

      this.$nextTick(() => {
        wrap.style.minHeight = `${scaler.offsetHeight + 8}px`;
      });
    },
  },
};
