#!/usr/bin/env node

import { Command } from 'commander';
import { createTestFile } from './commands/createTestFile';
import { runDocsServer } from './commands/runDocsServer';

const program = new Command();

program
  .name('murphis')
  .description('Command line tool for interacting with Solana programs')
  .version('1.0.0');

program
  .command('export')
  .description('Automatically create a test file based on the IDL of the Anchor program')
  .action(() => {
    createTestFile();
  });

program
  .command('run')
  .description('Run additional utilities')
  .argument('<type>', 'Type of utility (docs, test, ...)')
  .action((type) => {
    if (type === 'docs') {
      runDocsServer();
    } else {
      console.error(`Invalid utility type: ${type}`);
      process.exit(1);
    }
  });

program.parse(process.argv);