module.exports = class Url {
  constructor(path) {
    this.protocol = "http";
    this.domain = "127.1.1.1";
    this.port = 80;
    this.path = path;
  }

  getUrl() {
    return this.protocol + "://" + this.domain + ":" + this.port + "/" + this.path;
  }
}
