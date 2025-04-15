# ProgramKit SDK

Development tool for Solana Programs that helps interact with Solana programs through a web interface and automatically generates test suites.

## Features

1. **Automatic test file generation** - Create test files based on Anchor program IDL
2. **Web interaction interface** - Create a web page to interact with the program similar to Swagger for APIs

## Installation

```bash
# Clone repo
git clone https://github.com/your-username/programkit-sdk.git
cd programkit-sdk

# Install dependencies
npm install

# Build project
npm run build

# Install globally
npm install -g .
```

## Usage 

### Generate test files automatically

In your Anchor program directory, run:

```bash
murphis export
```

This command will find the IDL file in the `target/idl` directory and create corresponding test files in the `tests` directory.

### Run the web interface to interact with the program

In your Anchor program directory, run:

```bash
murphis run docs
```

This command will create and open a web page at http://localhost:3000 allowing you to:
- View information about the Solana program
- Interact with program instructions
- Send test transactions

## Project Structure

```
programkit-sdk/
├── src/                    # Source code 
│   ├── build.ts            # Main file processing CLI commands
│   └── commands/           # Specific commands
│       ├── createTestFile.ts  # Create test files
│       └── runDocsServer.ts   # Run web server docs
├── public/                 # Static files for web server
├── dist/                   # Compiled code (after build)
├── package.json            # Project configuration
└── README.md               # Documentation
```

## Requirements

- Node.js >= 14
- Solana CLI
- Anchor (for Solana program development)

## License

ISC # programkit-sdk
