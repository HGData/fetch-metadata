import * as core from '@actions/core'
import * as github from '@actions/github'
import * as verifiedCommits from './dependabot/verified_commits'
import * as updateMetadata from './dependabot/update_metadata'
import * as output from './dependabot/output'

export async function run (): Promise<void> {
  const token = core.getInput('github-token')

  if (!token) {
    /* eslint-disable no-template-curly-in-string */
    core.setFailed(
      'github-token is not set! Please add \'github-token: "${{ secrets.GITHUB_TOKEN }}"\' to your workflow file.'
    )
    /* eslint-enable no-template-curly-in-string */
    return
  }

  const githubClient = github.getOctokit(token)

  // Validate the job
  const commitMessage = await verifiedCommits.getMessage(githubClient, github.context)

  if (commitMessage) {
    // Parse metadata
    core.info('Parsing Dependabot metadata/')

    const updatedDependencies = updateMetadata.parse(commitMessage)

    if (updatedDependencies.length > 0) {
      output.set(updatedDependencies)
    } else {
      core.setFailed('PR does not contain metadata, nothing to do.')
    }
  } else {
    core.setFailed('PR is not from Dependabot, nothing to do.')
  }
}

run()
