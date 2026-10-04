export class Router {
  constructor({pages, onChange}) {
    this.pages = pages;
    this.onChange = onChange;
    this.current = null;
  }

  go(id) {
    if (!this.pages.includes(id)) throw new Error("Unknown page: " + id);
    this.current = id;
    this.onChange(id);
  }
}
