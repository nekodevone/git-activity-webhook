export interface Commit {
  url: string
  sha: string
  node_id: string
  html_url: string
  comments_url: string
  commit: CommitClass
  author: CommitAuthor
  committer: CommitAuthor
  parents: Tree[]
}

export interface CommitAuthor {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
}

export interface CommitClass {
  url: string
  author: CommitAuthorClass
  committer: CommitAuthorClass
  message: string
  tree: Tree
  comment_count: number
  verification: Verification
}

export interface CommitAuthorClass {
  name: string
  email: string
  date: Date
}

export interface Tree {
  url: string
  sha: string
}

export interface Verification {
  verified: boolean
  reason: string
  signature: null
  payload: null
}
