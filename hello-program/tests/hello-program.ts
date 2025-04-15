import * as anchor from '@coral-xyz/anchor';
import { HelloProgram } from '../target/types/hello_program';

describe('hello-program', () => {
  // Configure the Anchor provider & load the program IDL
  // The IDL gives you a typescript module
  //
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.HelloProgram as anchor.Program<HelloProgram>;

  it('Say hello!', async () => {
    const tx = await program.methods.hello().accounts({}).rpc();
    
    console.log("Transaction signature:", tx);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const txInfo = await provider.connection.getTransaction(tx, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed"
    });
    
    console.log("Transaction info received:", !!txInfo);
    if (txInfo && txInfo.meta) {
      const logs = txInfo.meta.logMessages || [];
      console.log("Raw logs received:", logs.length > 0);
      
      const programLogs = logs
        .filter(log => log.includes("Program log:"))
        .map(log => log.replace("Program log: ", ""));
      
      console.log("\n=== Program Logs ===");
      if (programLogs.length > 0) {
        programLogs.forEach(log => console.log(log));
      } else {
        console.log("No program logs found");
      }
      console.log("===================\n");
    } else {
      console.log("Could not fetch transaction info or logs");
    }
  });
});