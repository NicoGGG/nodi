#!/usr/bin/env node

import * as ejs from 'ejs';
import { promises as fs } from 'fs';
import { command } from 'execa';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { join } from 'path';

interface Args {
  project: string;
}

(async () => {
  const templates = [
    'index.ts',
    'package.json',
    'tsconfig.json',
    'tsconfig.build.json',
    '.gitignore',
    '.prettierrc',
    '.eslintrc.js',
  ];
  const templatesDir = join(__dirname, 'templates');
  try {
    const argv = yargs(hideBin(process.argv))
      .option('project', {
        alias: 'p',
        describe: 'Name of the project',
        type: 'string',
        demandOption: true,
      })
      .help()
      .alias('help', 'h')
      .parseSync() as Args;

    console.log(`Creating project ${argv.project}`);

    if (!argv.project) {
      throw new Error('Project name is required.');
    }

    const renderedFiles = new Array<Promise<string>>();
    templates.forEach((file) => {
      renderedFiles.push(
        ejs.renderFile(`${templatesDir}/${file}.ejs`, {
          name: argv.project,
        }),
      );
    });

    await fs.mkdir(`${argv.project}/src`, { recursive: true });
    const files = await Promise.all(renderedFiles);

    files.forEach(async (file, index) => {
      await fs.writeFile(`${argv.project}/${templates[index]}`, file);
    });
    console.log('Files written successfully.');
    await fs.rename(`${argv.project}/index.ts`, `${argv.project}/src/index.ts`);
    console.log('Installing dependencies...');

    await command('npm install --verbose', {
      stdio: 'ignore',
      cwd: argv.project,
    });
    await command('git init', {
      stdio: 'ignore',
      cwd: argv.project,
    });
    await command('git add .'),
      {
        stdio: 'ignore',
        cwd: argv.project,
      };
    await command("git commit -m 'init commit'"),
      {
        stdio: 'ignore',
        cwd: argv.project,
      };

    console.log('Template rendered and written to file successfully.');
  } catch (err) {
    console.error('Error rendering template or writing to file:', err);
  }
})();
