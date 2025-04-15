let walletPublicKey = null;
let phantomProvider = null;

const checkIfWalletIsConnected = async () => {
  try {
    // Found Phantom wallet
    if (window.phantom?.solana) {
      console.log("Phát hiện phantom.solana");
      phantomProvider = window.phantom.solana;
    } else if (window.solana?.isPhantom) {
      console.log("Phát hiện window.solana");
      phantomProvider = window.solana;
    } else {
      console.log("Không tìm thấy ví Phantom");
      return false;
    }

    try {
      // Kiểm tra xem đã kết nối chưa
      const resp = await phantomProvider.connect({ onlyIfTrusted: true });
      console.log("Auto-connect response:", resp);
      walletPublicKey = resp.publicKey.toString();
      
      // Cập nhật UI
      updateWalletUI();
      return true;
    } catch (err) {
      console.log("Chưa kết nối/tin tưởng với ví:", err);
      return false;
    }
  } catch (error) {
    console.log("Lỗi kiểm tra ví:", error);
    return false;
  }
};

const updateWalletUI = () => {
  if (walletPublicKey) {
    document.getElementById('wallet-address').textContent = walletPublicKey.slice(0, 4) + '...' + walletPublicKey.slice(-4);
    document.getElementById('wallet-address').style.display = 'block';
    document.getElementById('connect-wallet').textContent = 'Ngắt kết nối';
    document.getElementById('connect-wallet').classList.add('disconnect-wallet');
    document.getElementById('wallet-status-message').textContent = 'Đã kết nối với ví: ' + walletPublicKey.slice(0, 4) + '...' + walletPublicKey.slice(-4);
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
    document.getElementById('connect-wallet').textContent = 'Kết nối ví';
    document.getElementById('connect-wallet').classList.remove('disconnect-wallet');
    document.getElementById('wallet-status-message').textContent = 'Chưa kết nối';
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
    
    // Debug thông tin môi trường
    console.log("DEBUG: Web3 environment info", {
      "window.solanaWeb3 exists": typeof window.solanaWeb3 !== 'undefined',
      "window.solana exists": typeof window.solana !== 'undefined',
      "window.solana.clusterApiUrl exists": typeof window.solana?.clusterApiUrl === 'function',
      "window có hàm Transaction": typeof window.solanaWeb3?.Transaction === 'function' || typeof window.solana?.Transaction === 'function'
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

    // Kiểm tra thư viện trước (phương pháp 2 - backup)
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
      
      // Đợi biến global được tạo
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
            resultDiv.textContent += '\n' + result.details;
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
});