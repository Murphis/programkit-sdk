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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDocsServer = runDocsServer;
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function runDocsServer() {
    const app = (0, express_1.default)();
    const router = express_1.default.Router();
    const port = 3000;
    // Create public directory if it doesn't exist
    const publicDir = path.join(__dirname, '../../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    // Always create/update CSS and JS files 
    // Create CSS file
    fs.writeFileSync(path.join(publicDir, 'style.css'), `
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f6f8fa; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background-color: #24292e; color: white; padding: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { margin: 0; }
    .wallet-container { display: flex; align-items: center; }
    .connect-wallet { background-color: #4CAF50; color: white; border: none; padding: 10px 16px; border-radius: 3px; cursor: pointer; margin-left: 10px; }
    .connect-wallet:hover { background-color: #3e8e41; }
    .disconnect-wallet { background-color: #f44336; color: white; }
    .disconnect-wallet:hover { background-color: #d32f2f; }
    .wallet-address { color: white; margin-right: 10px; font-size: 14px; background-color: rgba(255,255,255,0.1); padding: 5px 10px; border-radius: 3px; }
    .program-info { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); margin-bottom: 20px; }
    .instruction { background-color: white; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .instruction-header { padding: 15px 20px; background-color: #f1f8ff; border-bottom: 1px solid #e1e4e8; border-top-left-radius: 8px; border-top-right-radius: 8px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; }
    .instruction-header h3 { margin: 0; }
    .instruction-body { padding: 20px; display: none; }
    .instruction-body.open { display: block; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: 600; }
    input, textarea { width: 100%; padding: 8px; border: 1px solid #e1e4e8; border-radius: 3px; box-sizing: border-box; }
    button { background-color: #0366d6; color: white; border: none; padding: 10px 16px; border-radius: 3px; cursor: pointer; }
    button:hover { background-color: #0256b3; }
    .results { margin-top: 20px; background-color: #f6f8fa; padding: 15px; border-radius: 3px; white-space: pre-wrap; }
    .wallet-required { color: #f44336; margin-top: 10px; display: none; }
    .connection-guide { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-top: 15px; }
    .connection-guide h3 { margin-top: 0; color: #24292e; }
    .connection-guide ol { padding-left: 20px; }
    .connection-guide li { margin-bottom: 8px; }
    .connection-guide a { color: #0366d6; text-decoration: none; }
    .connection-guide a:hover { text-decoration: underline; }
    .wallet-status { margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; border-left: 4px solid #ccc; }
    .wallet-status h3 { margin-top: 0; margin-bottom: 5px; }
    #wallet-status-message { font-weight: 500; }
    
    /* Responsive design */
    @media (max-width: 768px) {
      .header { flex-direction: column; text-align: center; }
      .wallet-container { margin-top: 15px; }
      .instruction-header { flex-direction: column; }
      .instruction-header span { margin-top: 5px; }
    }
    `);
    // Create JavaScript file
    console.log("Create file script.js in directory:", publicDir);
    fs.writeFileSync(path.join(publicDir, 'script.js'), `let walletPublicKey = null;
let phantomProvider = null;

const checkIfWalletIsConnected = async () => {
  try {
    // Found Phantom wallet
    if (window.phantom?.solana) {
      console.log("Found phantom.solana");
      phantomProvider = window.phantom.solana;
    } else if (window.solana?.isPhantom) {
      console.log("Found window.solana");
      phantomProvider = window.solana;
    } else {
      console.log("Not found Phantom wallet");
      return false;
    }

    try {
      // Check if connected
      const resp = await phantomProvider.connect({ onlyIfTrusted: true });
      console.log("Auto-connect response:", resp);
      walletPublicKey = resp.publicKey.toString();
      
      // Update UI
      updateWalletUI();
      return true;
    } catch (err) {
      console.log("Not connected/trusted with wallet:", err);
      return false;
    }
  } catch (error) {
    console.log("Error checking wallet:", error);
    return false;
  }
};

const updateWalletUI = () => {
  if (walletPublicKey) {
    document.getElementById('wallet-address').textContent = walletPublicKey.slice(0, 4) + '...' + walletPublicKey.slice(-4);
    document.getElementById('wallet-address').style.display = 'block';
    document.getElementById('connect-wallet').textContent = 'Ngắt kết nối';
    document.getElementById('connect-wallet').classList.add('disconnect-wallet');
    document.getElementById('wallet-status-message').textContent = 'Connected with wallet: ' + walletPublicKey.slice(0, 4) + '...' + walletPublicKey.slice(-4);
    document.getElementById('wallet-status-message').style.color = '#4CAF50';
    
    // Update any signer fields with connected wallet address
    document.querySelectorAll('input[required]').forEach(input => {
      if (input.id.startsWith('account_')) {
        input.value = walletPublicKey;
      }
    });
    
    // Hide wallet required messages
    document.querySelectorAll('.wallet-required').forEach(msg => {
      msg.style.display = 'none';
    });
  } else {
    document.getElementById('wallet-address').style.display = 'none';
    document.getElementById('connect-wallet').textContent = 'Connect wallet';
    document.getElementById('connect-wallet').classList.remove('disconnect-wallet');
    document.getElementById('wallet-status-message').textContent = 'Not connected';
    document.getElementById('wallet-status-message').style.color = '';
  }
};

const connectWallet = async () => {
  try {
    console.log("Starting wallet connection...");
    
    // Debug: check if Phantom wallet exists
    console.log("window.phantom:", window.phantom);
    console.log("window.solana:", window.solana);
    
    // Found Phantom wallet
    if (window.phantom?.solana) {
      console.log("Found Phantom wallet");
      phantomProvider = window.phantom.solana;
    } else if (window.solana?.isPhantom) {
      console.log("Found window.solana");
      phantomProvider = window.solana;
    } else {
      console.log("Phantom wallet not found");
      window.open('https://phantom.app/', '_blank');
      alert('Please install Phantom wallet to connect');
      return;
    }
    
    console.log("Wallet provider:", phantomProvider);
    
    // Try connecting with try-catch
    try {
      console.log("Requesting wallet connection...");
      const resp = await phantomProvider.connect();
      console.log("Connection result:", resp);
      walletPublicKey = resp.publicKey.toString();
      
      console.log("Connected to wallet:", walletPublicKey);
      
      // Update UI
      updateWalletUI();
    } catch (connErr) {
      console.error("Error during wallet connection:", connErr);
      
      // Check if already connected before
      try {
        const isConnected = await phantomProvider.isConnected();
        if (isConnected) {
          const publicKey = await phantomProvider.publicKey;
          if (publicKey) {
            walletPublicKey = publicKey.toString();
            console.log("Connected to wallet:", walletPublicKey);
            updateWalletUI();
            return;
          }
        }
      } catch (e) {
        console.log("Error checking connection:", e);
      }
      
      // Show error message
      alert('Wallet connection error: ' + connErr.message);
    }
  } catch (err) {
    console.error("Wallet connection error:", err);
    alert('Wallet connection error: ' + err.message);
  }
};

const disconnectWallet = async () => {
  try {
    if (phantomProvider) {
      console.log("Disconnecting wallet...");
      await phantomProvider.disconnect();
    }
    
    walletPublicKey = null;
    updateWalletUI();
    console.log("Disconnected from wallet");
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
  }
};

// Function to create transaction from data returned from server
const createTransaction = async (txInstructions) => {
  try {
    if (!phantomProvider || !walletPublicKey) {
      throw new Error('Wallet not connected');
    }
    
    console.log("Received transaction data from server:", txInstructions);
    
    // Debug environment info
    console.log("DEBUG: Web3 environment info", {
      "window.solanaWeb3 exists": typeof window.solanaWeb3 !== 'undefined',
      "window.solana exists": typeof window.solana !== 'undefined',
      "window.solana.clusterApiUrl exists": typeof window.solana?.clusterApiUrl === 'function',
      "window has Transaction": typeof window.solanaWeb3?.Transaction === 'function' || typeof window.solana?.Transaction === 'function'
    });

    // Create simple transaction (method 1) - This is simpler and may work better
    try {
      console.log("Creating simple transaction (without web3.js)");
      const instruction = txInstructions.instructions[0];
      
      // Create minimal transaction structure that Phantom can understand
      const simpleTransaction = {
        // No need for blockhash - Phantom will automatically add the latest blockhash
        feePayer: new solana.PublicKey(walletPublicKey),
        instructions: [{
          programId: new solana.PublicKey(instruction.programId),
          keys: instruction.instruction.accounts,
          data: Buffer.from(instruction.instruction.data.discriminator)
        }]
      };
      
      console.log("Created simple transaction:", simpleTransaction);
      return simpleTransaction;
    } catch (simpleTxError) {
      console.error("Error creating simple transaction:", simpleTxError);
      // Continue with fallback method below
    }

    // Check library before (method 2 - backup)
    try {
      await loadSolanaWeb3();
    } catch (loadErr) {
      console.error("Error loading Solana Web3:", loadErr);
      
      // Create fallback transaction (simple) if library fails to load
      console.log("Creating fallback transaction (simple)");
      
      // Get necessary information from transaction data
      const instruction = txInstructions.instructions[0];
      const programId = instruction.programId;
      
      // Create simple transaction
      const fallbackTx = {
        feePayer: walletPublicKey,
        recentBlockhash: "samplehash", // Phantom will fill in the actual blockhash
        instructions: [{
          programId: programId,
          keys: instruction.instruction.accounts.map(acc => ({
            pubkey: acc.pubkey,
            isSigner: acc.isSigner,
            isWritable: acc.isWritable
          })),
          data: Buffer.from(instruction.instruction.data.discriminator)
        }]
      };
      
      console.log("Created fallback transaction:", fallbackTx);
      return fallbackTx;
    }
    
    // Use global variable after successful loading
    if (!window.solanaWeb3) {
      throw new Error('Solana Web3 not found after loading');
    }
    
    const solana = window.solanaWeb3;
    
    // Get necessary fields
    const instruction = txInstructions.instructions[0];
    const programId = instruction.programId;
    
    // Create connection to Solana
    console.log("Creating connection to Solana with network:", txInstructions.network || 'devnet');
    const connection = new solana.Connection(
      solana.clusterApiUrl(txInstructions.network || 'devnet'),
      'confirmed'
    );
    
    // Create transaction
    const transaction = new solana.Transaction();
    
    // Set recent blockhash and feePayer
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new solana.PublicKey(walletPublicKey);
    
    // Create instruction from data
    const accounts = instruction.instruction.accounts.map(acc => ({
      pubkey: new solana.PublicKey(acc.pubkey),
      isSigner: acc.isSigner,
      isWritable: acc.isWritable
    }));
    
    console.log("Account metas:", accounts);
    
    // Encode data in Anchor format
    const dataBuffer = new Uint8Array(instruction.instruction.data.discriminator);
    
    // Create instruction object
    const solanaInstruction = new solana.TransactionInstruction({
      keys: accounts,
      programId: new solana.PublicKey(programId),
      data: dataBuffer
    });
    
    // Add instruction to transaction
    transaction.add(solanaInstruction);
    console.log("Created transaction:", transaction);
    
    return transaction;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

function loadSolanaWeb3() {
  return new Promise((resolve, reject) => {
    // If already exists, use it
    if (typeof window.solanaWeb3 !== 'undefined') {
      console.log("solanaWeb3 already loaded");
      return resolve(window.solanaWeb3);
    }
    
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src*="solana/web3.js"]');
    if (existingScript) {
      console.log("Script already added to DOM");
      
      // Wait for script to load
      const waitForSolanaWeb3 = setInterval(() => {
        if (typeof window.solanaWeb3 !== 'undefined') {
          clearInterval(waitForSolanaWeb3);
          console.log("solanaWeb3 loaded after waiting");
          resolve(window.solanaWeb3);
        }
      }, 100);
      
      // Set timeout 5 seconds
      setTimeout(() => {
        clearInterval(waitForSolanaWeb3);
        reject(new Error('Timeout waiting for solanaWeb3 to load'));
      }, 5000);
      
      return;
    }
    
    // Create new script
    console.log("Adding script solana/web3.js to page");
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@solana/web3.js@1.73.0/lib/index.iife.js';
    script.async = true;
    
    script.onload = () => {
      console.log("Script solana/web3.js loaded");
      
      // Wait for global variable to be created
      const checkForSolanaWeb3 = setInterval(() => {
        if (typeof window.solanaWeb3 !== 'undefined') {
          clearInterval(checkForSolanaWeb3);
          console.log("Found window.solanaWeb3");
          resolve(window.solanaWeb3);
        }
      }, 100);
      
      // Set timeout 3 seconds
      setTimeout(() => {
        clearInterval(checkForSolanaWeb3);
        if (typeof window.solanaWeb3 !== 'undefined') {
          resolve(window.solanaWeb3);
        } else {
          console.error("Script loaded but window.solanaWeb3 not found");
          reject(new Error('Could not find window.solanaWeb3 after loading'));
        }
      }, 3000);
    };
    
    script.onerror = (err) => {
      console.error("Error loading script:", err);
      reject(new Error('Could not load script solana/web3.js'));
    };
    
    document.head.appendChild(script);
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log("Page loaded, initializing application...");
  
  try {
    // Load Solana Web3 and wait for completion
    console.log("Starting to load Solana Web3...");
    await loadSolanaWeb3();
    console.log("Solana Web3 loaded");
    
    // Wait a moment to allow Phantom Extension to initialize
    setTimeout(async () => {
      // Check if wallet is connected
      await checkIfWalletIsConnected();
    }, 500);
  } catch (error) {
    console.error("Error initializing:", error);
  }
  
  // Setup wallet connection button
  const connectWalletBtn = document.getElementById('connect-wallet');
  connectWalletBtn.addEventListener('click', function() {
    console.log("Clicked connect wallet button. Current status:", walletPublicKey ? "Connected" : "Not connected");
    if (walletPublicKey) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  });
  
  // Toggle instructions
  document.querySelectorAll('.instruction-header').forEach(header => {
    header.addEventListener('click', function() {
      const body = this.nextElementSibling;
      body.classList.toggle('open');
    });
  });
  
  // Form submission
  document.querySelectorAll('.instruction-form').forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const instructionName = this.getAttribute('data-instruction');
      const resultDiv = this.querySelector('.results');
      const walletRequiredMsg = this.querySelector('.wallet-required');
      
      // Check if wallet is connected for actual transaction
      if (!walletPublicKey) {
        walletRequiredMsg.style.display = 'block';
        return;
      }
      
      resultDiv.textContent = 'Processing...';
      
      // Collect form data
      const formData = new FormData(this);
      const data = {
        instruction: instructionName,
        accounts: {},
        args: {},
        wallet: walletPublicKey
      };
      
      // Parse form data
      for (let [key, value] of formData.entries()) {
        if (key.startsWith('account_')) {
          const accountName = key.replace('account_', '');
          data.accounts[accountName] = value;
        } else if (key.startsWith('arg_')) {
          const argName = key.replace('arg_', '');
          data.args[argName] = value;
        }
      }
      
      try {
        // Send request to server to get transaction data
        const response = await fetch('/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.error) {
          resultDiv.textContent = 'Error: ' + result.error;
          if (result.details) {
            resultDiv.textContent += '\\n' + result.details;
          }
        } else if (result.simulation) {
          // If this is a simulation result
          resultDiv.innerHTML = '<h4>Simulation result:</h4><pre>' + JSON.stringify(result, null, 2) + '</pre>';
        } else if (result.transaction) {
          // If this is the actual transaction to sign
          try {
            // Process transaction
            const transaction = await createTransaction(result.transaction);
            
            console.log("DEBUG: Transaction details before signing:", transaction);
            
            try {
              // Sign and send transaction with detailed error handling
              console.log("Starting to sign and send transaction with Phantom...");
              const signResult = await phantomProvider.signAndSendTransaction(transaction);
              console.log("Transaction signing result:", signResult);
              
              const signature = signResult.signature;
              
              resultDiv.innerHTML = '<h4>Transaction sent!</h4>' +
                '<p>Transaction signature: ' + signature + '</p>' +
                '<p><a href="https://explorer.solana.com/tx/' + signature + '?cluster=' + (result.network || 'devnet') + '" target="_blank">View on Solana Explorer</a></p>';
            } catch (signError) {
              console.error("DEBUG: Transaction signing error:", {
                message: signError.message,
                name: signError.name,
                code: signError.code,
                stack: signError.stack,
                error: signError
              });
              
              // Show detailed error message
              resultDiv.innerHTML = '<h4>Transaction signing error:</h4>' +
                '<p>' + (signError.message || 'Unexpected error') + '</p>' +
                '<p><strong>Error details:</strong> ' + (signError.code || '') + 
                (signError.name ? ' - ' + signError.name : '') + '</p>' +
                '<p>Please check console for more information.</p>';
            }
          } catch (txError) {
            console.error("DEBUG: Transaction creation error:", txError);
            resultDiv.textContent = 'Transaction creation error: ' + txError.message;
          }
        } else {
          resultDiv.innerHTML = '<h4>Result:</h4><pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }
      } catch (error) {
        resultDiv.textContent = 'Connection error: ' + error.message;
      }
    });
  });
});`);
    // Serve static files from public directory
    app.use(express_1.default.static(path.join(__dirname, '../../public')));
    app.use(express_1.default.json());
    // Find IDL file
    const findIdlFile = () => {
        const idlDir = path.join(process.cwd(), 'target', 'idl');
        if (!fs.existsSync(idlDir)) {
            return null;
        }
        const files = fs.readdirSync(idlDir);
        const idlFile = files.find(file => file.endsWith('.json'));
        return idlFile ? path.join(idlDir, idlFile) : null;
    };
    // API endpoint to get IDL information
    // @ts-ignore
    router.get('/api/idl', function (req, res) {
        const idlPath = findIdlFile();
        if (!idlPath) {
            return res.status(404).json({ error: 'IDL not found' });
        }
        try {
            const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
            res.json(idl);
        }
        catch (error) {
            res.status(500).json({ error: 'Cannot read IDL file' });
        }
    });
    // Home page
    // @ts-ignore
    router.get('/', function (req, res) {
        const idlPath = findIdlFile();
        if (!idlPath) {
            return res.send(`
        <html>
          <head>
            <title>Program Documentation</title>
            <link rel="stylesheet" href="/style.css">
          </head>
          <body>
            <div class="header">
              <h1>Solana Program Documentation</h1>
              <div class="wallet-container">
                <span id="wallet-address" style="display: none;"></span>
                <button id="connect-wallet" class="connect-wallet">Connect Wallet</button>
              </div>
            </div>
            <div class="container">
              <div class="program-info">
                <h2>IDL not found</h2>
                <p>Please build Anchor program before running docs server.</p>
              </div>
            </div>
            <script src="/script.js"></script>
          </body>
        </html>
      `);
        }
        try {
            const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
            const programName = idl.metadata.name;
            const programAddress = idl.address;
            const instructions = idl.instructions || [];
            let instructionHtml = '';
            instructions.forEach((instruction) => {
                const name = instruction.name;
                const accounts = instruction.accounts || [];
                const args = instruction.args || [];
                let accountsHtml = '';
                accounts.forEach((account) => {
                    accountsHtml += `
            <div class="form-group">
              <label for="account_${account.name}">${account.name}:</label>
              <input type="text" id="account_${account.name}" name="account_${account.name}" placeholder="PublicKey address" ${account.isSigner ? 'required' : ''}>
              ${account.isSigner ? '<small>(Signer)</small>' : ''}
            </div>
          `;
                });
                let argsHtml = '';
                args.forEach((arg) => {
                    argsHtml += `
            <div class="form-group">
              <label for="arg_${arg.name}">${arg.name} (${typeof arg.type === 'string' ? arg.type : 'complex'}):</label>
              <input type="text" id="arg_${arg.name}" name="arg_${arg.name}" placeholder="Value" required>
            </div>
          `;
                });
                instructionHtml += `
          <div class="instruction">
            <div class="instruction-header">
              <h3>${name}</h3>
              <span>${accounts.length} accounts, ${args.length} args</span>
            </div>
            <div class="instruction-body">
              <form class="instruction-form" data-instruction="${name}">
                ${accounts.length > 0 ? '<h4>Accounts</h4>' : ''}
                ${accountsHtml}
                
                ${args.length > 0 ? '<h4>Arguments</h4>' : ''}
                ${argsHtml}
                
                <button type="submit">Execute</button>
                <div class="wallet-required">Please connect your wallet first</div>
                
                <div class="results"></div>
              </form>
            </div>
          </div>
        `;
            });
            const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${programName} Documentation</title>
            <link rel="stylesheet" href="/style.css">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <div class="header">
              <h1>${programName} Documentation</h1>
              <div class="wallet-container">
                <span id="wallet-address" style="display: none;"></span>
                <button id="connect-wallet" class="connect-wallet">Kết nối Phantom</button>
              </div>
            </div>
            
            <div class="container">
              <div class="program-info">
                <h2>Program Information</h2>
                <p><strong>Name:</strong> ${programName}</p>
                <p><strong>Program Address:</strong> <a href="https://explorer.solana.com/address/${programAddress}?cluster=devnet" target="_blank">${programAddress}</a></p>
                <p><strong>Version:</strong> ${idl.metadata.version}</p>
                <p><strong>Network:</strong> Devnet</p>
                <div class="wallet-status">
                  <h3>Wallet Status:</h3>
                  <div id="wallet-status-message">Checking wallet...</div>
                </div>
              </div>
              
              <h2>Instructions</h2>
              <p>The following instructions can be performed in this program:</p>
              ${instructionHtml}
            </div>
            
            <!-- Script check status -->
            <script>
              // Check and prepare global variables
              window.addEventListener('load', function() {
                console.log("=== DEBUG: Page loaded completely ===");
                
                // Debug environment information
                console.log("DEBUG: User Agent:", navigator.userAgent);
                console.log("DEBUG: Browser information:", {
                  "userAgent": navigator.userAgent,
                  "vendor": navigator.vendor,
                  "platform": navigator.platform
                });
                
                // Check if Phantom wallet exists
                console.log("DEBUG: Check Phantom Wallet object");
                console.log("DEBUG window.phantom:", window.phantom);
                console.log("DEBUG window.solana:", window.solana);
                
                if (window.phantom?.solana || window.solana?.isPhantom) {
                  document.getElementById('wallet-status-message').textContent = 
                    'Phantom Wallet detected, you can connect.';
                  document.getElementById('wallet-status-message').style.color = '#4CAF50';
                } else {
                  document.getElementById('wallet-status-message').textContent = 
                    'Phantom Wallet not found. Please install the extension.';
                  document.getElementById('wallet-status-message').style.color = '#f44336';
                }
                
                // Kiểm tra thư viện Solana Web3
                if (window.solanaWeb3) {
                  console.log("DEBUG: Solana Web3.js loaded successfully");
                } else {
                  console.error("DEBUG: Solana Web3.js not loaded - may affect wallet connection");
                }
                
                // Add click event for connect button for direct debug
                setTimeout(function() {
                  const connectBtn = document.getElementById('connect-wallet');
                  console.log("DEBUG: Connect button element:", connectBtn);
                  
                  if (connectBtn) {
                    // Add a new event listener for debug
                    connectBtn.addEventListener('click', function() {
                      console.log("=== DEBUG CLICK: Connect button clicked ===");
                      console.log("DEBUG CLICK: window.phantom:", window.phantom);
                      console.log("DEBUG CLICK: window.solana:", window.solana);
                    });
                    console.log("DEBUG: Successfully added event listener for connect button");
                  } else {
                    console.error("DEBUG: Cannot find connect button!");
                  }
                }, 1000);
              });
            </script>
            <script src="/script.js"></script>
          </body>
        </html>
      `;
            res.send(html);
        }
        catch (error) {
            res.status(500).send('Error reading IDL file');
        }
    });
    // API endpoint to execute instruction with real wallet
    // @ts-ignore
    router.post('/execute', function (req, res) {
        const { instruction, accounts, args, wallet } = req.body;
        // Find IDL file
        const idlPath = findIdlFile();
        if (!idlPath) {
            return res.status(404).json({ error: 'IDL not found' });
        }
        try {
            // Get program information from IDL
            const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
            const programId = idl.address;
            // Find instruction details from IDL
            const instrDetail = idl.instructions.find((instr) => instr.name === instruction);
            if (!instrDetail) {
                return res.status(404).json({ error: `Instruction ${instruction} not found in IDL` });
            }
            if (wallet) {
                // Return information to client-side browser to create transaction
                // DO NOT use wallet from Anchor, only use wallet from browser to sign
                // Necessary accounts for transaction
                const accountMetas = [];
                // Iterate through all accounts declared in instruction
                if (instrDetail.accounts && instrDetail.accounts.length > 0) {
                    instrDetail.accounts.forEach(accountInfo => {
                        const accountName = accountInfo.name;
                        let pubkey = accounts[accountName];
                        // If it's a signer and has no pubkey, use connected wallet
                        if (accountInfo.isSigner && (!pubkey || pubkey.trim() === '')) {
                            pubkey = wallet;
                        }
                        if (pubkey) {
                            accountMetas.push({
                                pubkey,
                                isSigner: accountInfo.isSigner,
                                isWritable: accountInfo.isMut
                            });
                        }
                    });
                }
                // Instruction data (discriminator + serialized args)
                const instructionData = {
                    programId,
                    instruction: {
                        name: instruction,
                        data: {
                            discriminator: instrDetail.discriminator,
                            args: args
                        },
                        accounts: accountMetas
                    }
                };
                console.log('Sending transaction data to client:', {
                    instruction,
                    programId,
                    wallet,
                    accountsCount: accountMetas.length
                });
                res.json({
                    success: true,
                    network: 'devnet', // or mainnet-beta, testnet depending on configuration
                    transaction: {
                        instructions: [instructionData],
                        type: 'anchor',
                        signers: [wallet] // Main signer is the connected wallet on browser
                    }
                });
            }
            else {
                // If no wallet, only simulate
                setTimeout(() => {
                    res.json({
                        success: true,
                        instruction,
                        simulation: true,
                        signature: 'sim_' + Math.random().toString(36).substring(2, 15),
                        timestamp: new Date().toISOString(),
                        message: 'Simulated transaction successful'
                    });
                }, 1000);
            }
        }
        catch (error) {
            console.error('Error processing transaction:', error);
            res.status(500).json({
                error: 'Cannot process transaction',
                details: error.message
            });
        }
    });
    app.use(router);
    app.listen(port, () => {
        console.log(`Server docs is running at http://localhost:${port}`);
        // Automatically open browser (works on Windows, Mac, and Linux)
        try {
            const command = process.platform === 'win32'
                ? `start http://localhost:${port}`
                : process.platform === 'darwin'
                    ? `open http://localhost:${port}`
                    : `xdg-open http://localhost:${port}`;
            (0, child_process_1.execSync)(command);
        }
        catch (error) {
            console.log('Cannot automatically open browser.');
        }
    });
}
