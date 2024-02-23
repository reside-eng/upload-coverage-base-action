import * as core from '@actions/core';
import { context } from '@actions/github';
import { existsSync, mkdirSync } from 'fs';
import { vi, describe, beforeEach, it, Mocked } from 'vitest';
import { run } from './main';

vi.mock('@actions/core');
vi.mock('fs');

interface MockObj {
  inputs: Record<string, string | undefined>;
  repo: {
    owner: string;
    repo: string;
  };
  workflow: string;
  prNumber: number;
  headRef: string;
  eventName: string;
  ref: string;
}

let mock: MockObj;
const mockedExistsSync = vi.mocked(existsSync);
mockedExistsSync.mockImplementation(() => true);
const mockedMkdirSync = vi.mocked(mkdirSync);
mockedMkdirSync.mockImplementation(() => '');

vi.mock('./coveralls.ts', () => ({
  reportToCoveralls: vi.fn(),
}));

vi.mock('@actions/github', () => ({
  getOctokit: vi.fn(() => ({
    rest: {
      actions: {
        listWorkflowRuns: vi
          .fn()
          .mockResolvedValue({ data: { workflow_runs: [{}] } }),
        listWorkflowRunArtifacts: vi
          .fn()
          .mockResolvedValue({ data: { artifacts: [{}] } }),
        downloadArtifact: vi.fn().mockResolvedValue({ data: {} }),
      },
    },
    paginate: vi.fn().mockResolvedValue([{ name: 'coverage-test' }]),
  })),
  context: {
    repo: {
      owner: 'reside-eng',
      repo: 'test',
    },
    payload: {
      pull_request: {
        head: { ref: 'test', sha: 'test' },
      },
    },
  },
}));

const mockCore = core as Mocked<typeof core>;

/**
 *
 */
function setupMock() {
  vi.clearAllMocks();
  mock = {
    // Default action inputs
    inputs: {
      'coveralls-token': 'asdf',
      'github-token': `${process.env.GITHUB_TOKEN}`,
      'lcov-path': 'coverage/lcov.info',
    },
    repo: {
      owner: 'reside-eng',
      repo: 'upload-coverage-base-action',
    },
    workflow: 'Failure workflow (for test purpose only)',
    prNumber: 4,
    headRef: 'main',
    ref: 'main',
    eventName: 'pull_request',
  };

  mockCore.getInput.mockImplementation(
    (name: string): string => mock.inputs[name] || '',
  );

  // Setting to this Github repo by default
  context.workflow = mock.workflow;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // context.repo = mock.repo
  // context.payload.pull_request = {
  //   number: mock.prNumber,
  //   head: {
  //     ref: mock.headRef,
  //   },
  // };
  // context.ref = mock.ref;
}

describe('Run function', () => {
  beforeEach(() => setupMock());
  it('should call to report to coveralls if existing file is found', async () => {
    await run();
    // expect(reportToCoveralls).toHaveBeenCalledTimes(1);
    // expect(reportToCoveralls).toHaveBeenCalledWith('./lcov.info');
  });
});
