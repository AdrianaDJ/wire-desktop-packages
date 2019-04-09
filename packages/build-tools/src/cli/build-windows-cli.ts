#!/usr/bin/env node

/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

import commander from 'commander';
import electronPackager from 'electron-packager';
import * as path from 'path';

import {checkCommanderOptions, getLogger, getToolName, writeJson} from '../lib/build-utils';
import {getCommonConfig, logEntries} from '../lib/commonConfig';

const toolName = getToolName(__filename);
const logger = getLogger(toolName);

commander
  .name(toolName)
  .description('Build the Wire wrapper for Windows')
  .option('-w, --wire-json <path>', 'Specify the wire.json path')
  .parse(process.argv);

checkCommanderOptions(commander, ['wireJson']);

const wireJsonResolved = path.resolve(commander.wireJson);
const {commonConfig, defaultConfig} = getCommonConfig({envFile: '.env.defaults', wireJson: wireJsonResolved});

const packagerOptions: electronPackager.Options = {
  appCopyright: commonConfig.copyright,
  appVersion: commonConfig.version,
  arch: 'ia32',
  asar: true,
  buildVersion: commonConfig.buildNumber,
  dir: commonConfig.electronDirectory,
  icon: `${commonConfig.electronDirectory}/img/logo.ico`,
  ignore: new RegExp(`${commonConfig.electronDirectory}/renderer/src`),
  name: commonConfig.name,
  out: 'wrap/build',
  overwrite: true,
  platform: 'win32',
  protocols: [{name: `${commonConfig.name} Core Protocol`, schemes: [commonConfig.customProtocolName]}],
  quiet: false,
  win32metadata: {
    CompanyName: commonConfig.name,
    FileDescription: commonConfig.description,
    InternalName: `${commonConfig.name}.exe`,
    OriginalFilename: `${commonConfig.name}.exe`,
    ProductName: commonConfig.name,
  },
};

logEntries(commonConfig, 'commonConfig', toolName);

logger.info(`Building ${commonConfig.name} ${commonConfig.version} for Windows ...`);

writeJson(wireJsonResolved, commonConfig)
  .then(() => electronPackager(packagerOptions))
  .then(([buildDir]) => logger.log(`Built package in "${buildDir}".`))
  .finally(() => writeJson(wireJsonResolved, defaultConfig))
  .catch(error => {
    logger.error(error);
    process.exit(1);
  });