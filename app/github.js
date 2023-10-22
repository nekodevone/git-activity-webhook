/**
 * @param {string} token - GitHub token
 * @param {string} repo - GitHub repository
 * @param {Date} since - Date to start fetching commits from
 * @param {Date} until - Date to stop fetching commits at
 * @returns {Promise<import('../types/contracts/commit').Commit[]>}
 */
async function fetchCommits(token, repo, since, until) {
  const endpoint = new URL(`https://api.github.com/repos/${repo}/commits`)
  endpoint.searchParams.set('per_page', '100')
  endpoint.searchParams.set('since', since.toISOString())
  endpoint.searchParams.set('until', until.toISOString())

  const response = await fetch(endpoint, {
    headers: {
      authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  return response.json()
}

/**
 * @param {string} token - GitHub token
 * @param {string} repo - GitHub repository
 * @param {Date} since - Date to start fetching commits from
 * @param {Date} until - Date to stop fetching commits at
 * @returns {Promise<import('../types/contracts/pull-request').PullRequest[]>}
 */
async function fetchPullRequests(token, repo, since, until) {
  const endpoint = new URL(`https://api.github.com/repos/${repo}/pulls`)
  endpoint.searchParams.set('per_page', '100')
  endpoint.searchParams.set('state', 'all')
  endpoint.searchParams.set('since', since.toISOString())
  endpoint.searchParams.set('until', until.toISOString())

  const response = await fetch(endpoint, {
    headers: {
      authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  })

  return response.json()
}

module.exports = {
  fetchCommits,
  fetchPullRequests
}
