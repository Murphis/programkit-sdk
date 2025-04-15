#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const createTestFile_1 = require("./commands/createTestFile");
const runDocsServer_1 = require("./commands/runDocsServer");
const program = new commander_1.Command();
program
    .name('murphis')
    .description('Command line tool for interacting with Solana programs')
    .version('1.0.0');
program
    .command('export')
    .description('Automatically create a test file based on the IDL of the Anchor program')
    .action(() => {
    (0, createTestFile_1.createTestFile)();
});
program
    .command('run')
    .description('Run additional utilities')
    .argument('<type>', 'Type of utility (docs, test, ...)')
    .action((type) => {
    if (type === 'docs') {
        (0, runDocsServer_1.runDocsServer)();
    }
    else {
        console.error(`Invalid utility type: ${type}`);
        process.exit(1);
    }
});
program.parse(process.argv);
