"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestFile = createTestFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function createTestFile() {
    // Find IDL file
    const idlPath = findIdlFile();
    if (!idlPath) {
        console.error('IDL file not found. Make sure you have built the Anchor program.');
        return;
    }
    // Read IDL file
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    const programName = idl.metadata.name;
    const programAddress = idl.address;
    // Get file name from program name, replace underscores with hyphens if needed
    const fileBaseName = programName.replace(/_/g, '-');
    // Create test file
    const testFilePath = path.join(process.cwd(), 'tests', `${fileBaseName}-sdk-test.ts`);
    // Create tests directory if it doesn't exist
    const testsDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir, { recursive: true });
    }
    // Get type name
    const typeName = capitalizeFirstLetter(camelize(programName));
    // Create types directory if it doesn't exist
    const typesDir = path.join(process.cwd(), 'target', 'types');
    if (!fs.existsSync(typesDir)) {
        fs.mkdirSync(typesDir, { recursive: true });
    }
    // Find existing types file, supporting different file name formats
    const possibleTypesFilePaths = [
        path.join(typesDir, `${programName}.ts`), // hello_program.ts
        path.join(typesDir, programName.replace(/_/g, '-') + '.ts'), // hello-program.ts
        path.join(typesDir, camelize(programName) + '.ts') // helloProgram.ts
    ];
    let typesFilePath = null;
    for (const filePath of possibleTypesFilePaths) {
        if (fs.existsSync(filePath)) {
            typesFilePath = filePath;
            console.log(`Using existing types file: ${typesFilePath}`);
            break;
        }
    }
    // If types file doesn't exist, create new one
    if (!typesFilePath) {
        typesFilePath = path.join(typesDir, `${programName}.ts`);
        const typesContent = renderTypesFromIdl(programName, idl);
        fs.writeFileSync(typesFilePath, typesContent);
        console.log(`Types file created at: ${typesFilePath}`);
    }
    // Generate test file content
    const testContent = generateTestContent(programName, typesFilePath, typeName, idl);
    // Write test file
    fs.writeFileSync(testFilePath, testContent);
    console.log(`Test file created at: ${testFilePath}`);
}
function findIdlFile() {
    const idlDir = path.join(process.cwd(), 'target', 'idl');
    if (!fs.existsSync(idlDir)) {
        return null;
    }
    const files = fs.readdirSync(idlDir);
    const idlFile = files.find(file => file.endsWith('.json'));
    return idlFile ? path.join(idlDir, idlFile) : null;
}
function renderTypesFromIdl(programName, idl) {
    // Create type name in PascalCase
    const typeName = capitalizeFirstLetter(camelize(programName));
    // Helper function to convert account definitions to type
    const renderAccounts = (accounts) => {
        if (!accounts || accounts.length === 0) {
            return 'accounts: []';
        }
        return `accounts: [
      ${accounts.map(account => {
            let accountType = `{
        name: "${account.name}",
        isMut: ${!!account.isMut},
        isSigner: ${!!account.isSigner}`;
            if (account.pda) {
                accountType += `,
        pda: {
          seeds: [${account.pda.seeds.map((seed) => typeof seed === 'string'
                    ? `"${seed}"`
                    : JSON.stringify(seed)).join(', ')}]
        }`;
            }
            return accountType + `
      }`;
        }).join(',\n      ')}
    ]`;
    };
    // Helper function to convert args definitions to type
    const renderArgs = (args) => {
        if (!args || args.length === 0) {
            return 'args: []';
        }
        return `args: [
      ${args.map(arg => {
            return `{
        name: "${arg.name}",
        type: ${typeof arg.type === 'string' ? `"${arg.type}"` : JSON.stringify(arg.type)}
      }`;
        }).join(',\n      ')}
    ]`;
    };
    // Render instructions
    const instructions = idl.instructions || [];
    const instructionsCode = instructions.map(instruction => {
        return `{
      name: "${instruction.name}",
      discriminator: [${instruction.discriminator?.join(', ') || ''}],
      ${renderAccounts(instruction.accounts)},
      ${renderArgs(instruction.args)}
    }`;
    }).join(',\n    ');
    // Generate types file content
    return `/**
 * Types automatically generated from IDL for program ${programName}.
 *
 * Generated by programkit-sdk.
 */
export type ${typeName} = {
  "address": "${idl.address}",
  "metadata": {
    "name": "${programName}",
    "version": "${idl.metadata.version}",
    "spec": "${idl.metadata.spec || '0.1.0'}",
    "description": "${idl.metadata.description || ''}"
  },
  "instructions": [
    ${instructionsCode}
  ]
};

/**
 * Utility function to get program address
 */
export function getProgramAddress(): string {
  return "${idl.address}";
}
`;
}
function generateTestContent(programName, typesFilePath, typeName, idl) {
    const instructions = idl.instructions || [];
    // Get relative path from tests directory to types file
    const relativePath = path.relative(path.join(process.cwd(), 'tests'), typesFilePath).replace(/\\/g, '/'); // Ensure correct path on Windows
    // Remove .ts extension
    const importPath = relativePath.replace(/\.ts$/, '');
    let testCases = '';
    instructions.forEach((instruction) => {
        const instructionName = instruction.name;
        const accountsParams = generateAccountsParams(instruction.accounts || []);
        const argsParams = generateArgsParams(instruction.args || []);
        testCases += `
  it('Test ${instructionName} instruction', async () => {
    // Prepare parameters
    ${argsParams.declarations}
    
    // Execute transaction
    const tx = await program.methods.${instructionName}(${argsParams.paramsList})
      .accounts({${accountsParams}})
      .rpc();
    
    console.log("Transaction signature:", tx);
    
    // Wait for transaction confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get transaction info
    const txInfo = await provider.connection.getTransaction(tx, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed"
    });
    
    // Display logs
    if (txInfo && txInfo.meta) {
      const logs = txInfo.meta.logMessages || [];
      const programLogs = logs
        .filter(log => log.includes("Program log:"))
        .map(log => log.replace("Program log: ", ""));
      
      console.log("\\n=== Program Logs ===");
      programLogs.forEach(log => console.log(log));
      console.log("===================\\n");
    }
  });`;
    });
    return `import * as anchor from '@coral-xyz/anchor';
import { ${typeName} } from '${importPath}';

describe('${programName} SDK Tests', () => {
  // Configure Anchor provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.${typeName} as anchor.Program<${typeName}>;

${testCases}
});
`;
}
function generateAccountsParams(accounts) {
    if (!accounts || accounts.length === 0) {
        return '';
    }
    return accounts.map((account) => {
        return `${account.name}: /* address of ${account.name} */`;
    }).join(',\n      ');
}
function generateArgsParams(args) {
    if (!args || args.length === 0) {
        return {
            declarations: '',
            paramsList: ''
        };
    }
    const declarations = args.map((arg) => {
        const defaultValue = getDefaultValueForType(arg.type);
        return `const ${arg.name} = ${defaultValue}; // Change to appropriate value`;
    }).join('\n    ');
    const paramsList = args.map((arg) => arg.name).join(', ');
    return {
        declarations,
        paramsList
    };
}
function getDefaultValueForType(type) {
    if (typeof type === 'string') {
        switch (type) {
            case 'string':
                return '""';
            case 'u8':
            case 'u16':
            case 'u32':
            case 'u64':
            case 'i8':
            case 'i16':
            case 'i32':
            case 'i64':
            case 'number':
                return '0';
            case 'bool':
                return 'false';
            case 'publicKey':
                return 'new anchor.web3.PublicKey("11111111111111111111111111111111")';
            default:
                return 'null';
        }
    }
    else if (type && type.array) {
        return '[]';
    }
    else if (type && type.option) {
        return 'null';
    }
    else {
        return '{}';
    }
}
function camelize(str) {
    return str.replace(/[-_](\w)/g, (_, c) => c.toUpperCase());
}
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
