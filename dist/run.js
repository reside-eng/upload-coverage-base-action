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
exports.run = void 0;
const core = __importStar(require('@actions/core'));
const github_1 = require('@actions/github');
const fs_1 = require('fs');
const actions_1 = require('./actions');
const coveralls_1 = require('./coveralls');
/**
 *
 */
async function run() {
  const { owner, repo } = github_1.context.repo;
  const { ref: headRef } = github_1.context?.payload?.pull_request?.head || {};
  const baseBranch = core.getInput('base-branch') || headRef || 'main';
  const coverageArtifact = await (0, actions_1.downloadCoverageArtifact)(
    owner,
    repo,
  );
  core.debug('Coverage artifact successfully downloaded, writing to disk');
  // Confirm coverage folder exists before writing to disk
  const coverageFolderPath = './coverage';
  const coveragePath = `${coverageFolderPath}/lcov.info`;
  if (!(0, fs_1.existsSync)(coverageFolderPath)) {
    (0, fs_1.mkdirSync)(coverageFolderPath);
  }
  // Write lcov.info file to coverage/lcov.info
  (0, fs_1.writeFileSync)(coveragePath, Buffer.from(coverageArtifact));
  core.debug('Write to disk successful, uploading to Coveralls');
  // Report to Coveralls as base
  await (0, coveralls_1.reportToCoveralls)(owner, repo, baseBranch);
}
exports.run = run;
