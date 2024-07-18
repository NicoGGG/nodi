#!/usr/bin/env node

import * as ejs from 'ejs';
import { promises as fs } from 'fs';
import { command } from 'execa';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { join } from 'path';
import chalk from 'chalk';

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

    console.log(chalk.blueBright(`Creating project ${argv.project}...`));

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

    const writtenFiles = new Array<Promise<void>>();
    files.forEach(async (file, index) => {
      writtenFiles.push(
        fs.writeFile(`${argv.project}/${templates[index]}`, file),
      );
    });
    await Promise.all(writtenFiles);
    console.log(chalk.green('Files written successfully 👍'));
    await fs.rename(`${argv.project}/index.ts`, `${argv.project}/src/index.ts`);
    console.log(chalk.blueBright('Installing dependencies...'));

    await command('npm install --verbose', {
      stdio: 'ignore',
      cwd: argv.project,
    });

    console.log(chalk.blueBright('Initializing git repository...'));
    await command('git init', {
      stdio: 'ignore',
      cwd: argv.project,
    });
    await command('git add .', {
      stdio: 'ignore',
      cwd: argv.project,
    });
    await command('git commit -minit', {
      stdio: 'ignore',
      cwd: argv.project,
    });

    console.log(
      chalk.green('Template rendered and written to file successfully 👍\n'),
    );

    console.log(chalk.bold("You're all set! 🚀"));
    console.log(chalk.bold(`\`cd ${argv.project}\` and start coding! 💻`));
  } catch (err) {
    console.error('Error rendering template or writing to file:', err);
  }
})();
