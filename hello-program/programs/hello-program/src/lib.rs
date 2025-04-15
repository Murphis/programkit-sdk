use anchor_lang::prelude::*;

declare_id!("HgHppAdsR6cH3Yh7r9KssrQxsh91XTwVgdaw42E1tc7K");

#[program]
pub mod hello_program{
    use super::*;

    pub fn hello(_ctx: Context<Hello>) -> Result<()> {
        msg!("Hello, Solana!");

        msg!("Our program's Program ID: {}", &id());

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Hello {}
