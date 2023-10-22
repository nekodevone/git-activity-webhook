require('dotenv/config')
const { CronJob } = require('cron')
const { fetchCommits, fetchPullRequests } = require('./github')
const { toDiscordTime } = require('./utils')

/** @typedef {import('../types/contracts/commit').Commit} Commit */
/** @typedef {import('../types/contracts/pull-request').PullRequest} PullRequest */

const WEBHOOK_URL = process.env.WEBHOOK_URL
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_REPO = process.env.GITHUB_REPO

if (!WEBHOOK_URL || !GITHUB_TOKEN || !GITHUB_REPO) {
  console.error('fatal: missing environment variables')
  process.exit(1)
}

// get commits
run()
  .then(() => {
    console.log('ready')
  })
  .catch((error) => {
    console.error('fatal:', error)
    process.exit(1)
  })

async function run() {
  const job = new CronJob(
    '00 12 * * SUN',
    runStatsReport,
    null,
    true,
    'Europe/Moscow'
  )

  job.start()

  // run once
  await runStatsReport()
}

async function runStatsReport() {
  const [since, until] = getStartAndEndOfTheWeek()

  console.log('running cycle:', {
    since: since.toString(),
    until: until.toString()
  })

  const [commits, pulls] = await fetchStats(since, until)
  const commitsMap = new Map(commits)
  const pullsMap = new Map(pulls)
  const authorsList = [...commitsMap.keys(), ...pullsMap.keys()]
  let commitsCount = 0

  const embed = {
    title: 'Статистика разработчиков за промежуток',
    description: `С ${toDiscordTime(since)} по ${toDiscordTime(until)}`,
    /** @type {unknown[]} */
    fields: []
  }

  for (const author of authorsList) {
    const commitList = commitsMap.get(author) || []
    const pullList = pullsMap.get(author) || []

    commitsCount += commitList.length
    embed.fields.push({
      name: author,
      value: `Коммитов: ${commitList.length}\nПулл-реквестов: ${pullList.length}`,
      inline: false
    })
  }

  if (commitsCount >= 100) {
    embed.description += `\n\n**Информация может быть неполноценной, т.к. количество комитов превысило за 100**`
  }

  const endpoint = new URL(WEBHOOK_URL)
  endpoint.searchParams.set('wait', 'true')

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      embeds: [embed]
    })
  })

  const text = await response.text()
  console.log('response:', text)
}

/**
 * @param {Date} since
 * @param {Date} until
 * @returns {Promise<[[string, Commit[]][], [string, PullRequest[]][]]>}
 */
async function fetchStats(since, until) {
  const [commits, pulls] = await Promise.all([
    fetchCommits(GITHUB_TOKEN, GITHUB_REPO, since, until),
    fetchPullRequests(GITHUB_TOKEN, GITHUB_REPO, since, until)
  ])

  // group commits/pulls by author and filter by date
  const sinceTime = since.getTime()
  const untilTime = until.getTime()

  /** @type {Map<string, Commit[]>} */
  const commitsByAuthor = new Map()

  /** @type {Map<string, PullRequest[]>} */
  const pullsByAuthor = new Map()

  for (const commit of commits) {
    let list = commitsByAuthor.get(commit.author.login)

    if (!list) {
      list = []
      commitsByAuthor.set(commit.author.login, list)
    }

    if (
      new Date(commit.commit.author.date).getTime() > sinceTime ||
      new Date(commit.commit.author.date).getTime() < untilTime
    ) {
      continue
    }

    list.push(commit)
  }

  for (const pull of pulls) {
    let list = pullsByAuthor.get(pull.user.login)

    if (!list) {
      list = []
      pullsByAuthor.set(pull.user.login, list)
    }

    if (
      new Date(pull.created_at).getTime() > sinceTime ||
      new Date(pull.created_at).getTime() < untilTime
    ) {
      continue
    }

    list.push(pull)
  }

  // entries
  const commitsEntries = [...commitsByAuthor.entries()]
  const pullsEntries = [...pullsByAuthor.entries()]

  // sort
  commitsEntries.sort((a, b) => b[1].length - a[1].length)
  pullsEntries.sort((a, b) => b[1].length - a[1].length)

  // print stats
  console.log('commits by author:')
  for (const [author, commits] of commitsEntries) {
    console.log(`- ${author} (${commits.length})`)
  }

  console.log('pull requests by author:')
  for (const [author, pull] of pullsEntries) {
    console.log(`- ${author} (${pull.length})`)
  }

  return [commitsEntries, pullsEntries]
}

/**
 * @returns {[Date, Date]}
 */
function getStartAndEndOfTheWeek() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  monday.setUTCHours(21, 0, 0, 0) // 00:00:00 по МСК

  const sunday = new Date(monday.getTime())
  sunday.setDate(monday.getDate() + 6)
  sunday.setUTCHours(20, 59, 59, 999) // 23:59:59 по МСК

  return [monday, sunday]
}
