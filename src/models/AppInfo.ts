export default class AppInfo {
  constructor(
    public id: string,
    public title: string,
    public name: string,
    public path: string,
    public isFinder?: boolean
  ) {
    this.enabled = true
  }

  enabled: boolean
}
