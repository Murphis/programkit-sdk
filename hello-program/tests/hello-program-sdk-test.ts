import * as anchor from '@coral-xyz/anchor';
import { HelloProgram } from '../target/types/hello_program';

describe('hello_program SDK Tests', () => {
  // Configure Anchor provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HelloProgram as anchor.Program<HelloProgram>;


  it('Test hello instruction', async () => {
    // Prepare parameters
    
    
    // Execute transaction
    const tx = await program.methods.hello()
      .accounts({})
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
      
      console.log("\n=== Program Logs ===");
      programLogs.forEach(log => console.log(log));
      console.log("===================\n");
    }
  });
});
