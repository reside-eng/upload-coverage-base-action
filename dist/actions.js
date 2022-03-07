'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null)
      for (var k in mod)
        if (k !== 'default' && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.downloadCoverageArtifact = exports.getCoverageArtifact = void 0;
const core = __importStar(require('@actions/core'));
const github_1 = require('@actions/github');
/**
 * Get Octokit instance initialized with github-token input
 *
 * @returns Octokit instance
 */
function getOctokitInstance() {
  const myToken = core.getInput('github-token');
  return (0, github_1.getOctokit)(myToken);
}
/**
 * @param owner - Repo owner
 * @param repo - Github repo name
 * @returns Coverage artifact
 */
async function getCoverageArtifact(owner, repo) {
  const { ref: branch, sha: lastCommitSha } =
    github_1.context?.payload?.pull_request?.head || {};
  core.info(
    `Branch and last commit sha loaded: ${JSON.stringify({
      branch,
      lastCommitSha,
    })}`,
  );
  const { rest } = getOctokitInstance();
  // Load workflow runs
  const { data: runsData } = await rest.actions.listWorkflowRuns({
    owner,
    repo,
    branch,
    // per_page: 3,
    event: 'pull_request',
    workflow_id: core.getInput('upload-workflow-filename'),
  });
  core.info(`Workflow runs loaded: ${runsData.total_count}`);
  // Filter workflow runs to the one with matching commit sha
  const matchedWorkflow = runsData.workflow_runs.find(
    (workflowRun) => workflowRun.head_sha === lastCommitSha,
  );
  if (!matchedWorkflow) {
    throw new Error(`no workflows matching head_sha "${lastCommitSha}"`);
  }
  const { id, status } = matchedWorkflow;
  core.info(
    `Matched workflow loaded, looking for artifacts${JSON.stringify({
      id,
      status,
    })} `,
  );
  if (status !== 'completed') {
    core.warning(
      'Associated verify workflow did not complete successfully, artifact may not be found',
    );
  }
  // Load artifacts associated with the loaded workflow run
  const { data: artifactsData } = await rest.actions.listWorkflowRunArtifacts({
    owner: github_1.context.repo.owner,
    repo: github_1.context.repo.repo,
    run_id: matchedWorkflow.id,
  });
  if (artifactsData.total_count === 0) {
    core.warning(`No artifacts found for workflow with id "${id}"`);
  }
  const coverageKey = core.getInput('coverage-artifact-name');
  core.info(
    `Workflow artifacts loaded, looking for artifact with name "${coverageKey}"`,
  );
  // Filter artifacts to coverage-$sha
  const matchArtifact = artifactsData.artifacts.find(
    (artifact) => artifact?.name === coverageKey,
  );
  if (!matchArtifact) {
    core.error(`No artifacts found for workflow with id "${id}"`);
    throw new Error('Matching coverage artifact not found');
  }
  core.info(`Matching coverage artifact found ${matchArtifact?.name}`);
  return matchArtifact;
}
exports.getCoverageArtifact = getCoverageArtifact;
/**
 * @param owner - Github repo owner
 * @param repo - Github repo name
 */
async function downloadCoverageArtifact(owner, repo) {
  const matchArtifact = await getCoverageArtifact(owner, repo);
  const { rest } = getOctokitInstance();
  const downloadArtifact = await rest.actions.downloadArtifact({
    owner,
    repo,
    artifact_id: matchArtifact.id,
    archive_format: 'zip',
  });
  return downloadArtifact.data;
}
exports.downloadCoverageArtifact = downloadCoverageArtifact;
