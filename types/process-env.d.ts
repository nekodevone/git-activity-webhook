declare namespace NodeJS {
  interface ProcessEnv {
    WEBHOOK_URL: string
    GITHUB_TOKEN: string
    GITHUB_REPO: string
  }
}
