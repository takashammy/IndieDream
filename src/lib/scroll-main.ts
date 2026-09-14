let scroller: HTMLElement | null = null;

export function setMainScroller(el: HTMLElement | null) {
  scroller = el;
}

export function scrollMainToTop() {
  if (scroller) scroller.scrollTop = 0;
  if (typeof window === "undefined") return;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}
