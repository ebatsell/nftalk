use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};


declare_id!("6gPJfJrAhqH2SSa5morvHwBWeET8FNqHX2MTUCRoCJbX");

#[program]
pub mod nftalk {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        let my_account = &mut ctx.accounts.my_account;
        my_account.total_messages = 0;
        Ok(())
    }

    pub fn post_message(ctx: Context<CRUDMessage>, text: String) -> ProgramResult {
        // Fetch current chain time in seconds
        let clock = Clock::get()?;
        let ts = clock.unix_timestamp;
        
        // Hash message params
        // create a Sha256 object
        // Code inspired by https://docs.rs/sha2/latest/sha2/index.html
        let mut hasher = Sha256::new();

        // Generate message id
        hasher.update(format!("{} {}", text, ts).as_bytes());
        let result = hasher.finalize();
        let result32chars = format!("{:x}", result);
        let message_id = result32chars[0..32].to_string();

        let user = &ctx.accounts.user;

        let m = Message {
            id: message_id,
            text: text,
            timestamp: ts,
            score: 0,
            user_pubkey: *user.to_account_info().key,
        };

        let my_acc = &mut ctx.accounts.my_account;
        my_acc.messages.push(m);
        my_acc.total_messages += 1;
        Ok(())
    }

    pub fn delete_message(ctx: Context<CRUDMessage>, target_id: String) -> ProgramResult {
        let my_acc = &mut ctx.accounts.my_account;
        let user = &ctx.accounts.user;

        // Dumb way now - iterate through messages by id and remove the one that matches
        for (i, message) in my_acc.messages.iter().enumerate() {
            if (message.id == target_id && message.user_pubkey == *user.to_account_info().key) {
                my_acc.messages.remove(i);
                my_acc.total_messages -= 1;
                return Ok(());
            }
        }
        Err(ErrorCode::InvalidMessage.into())
    }
    
    pub fn upvote_message(ctx: Context<CRUDMessage>, target_id: String) -> ProgramResult {
        let my_acc = &mut ctx.accounts.my_account;
        for message in my_acc.messages.iter_mut() {
            if message.id == target_id {
                message.score += 1;
                return Ok(());
            }
        }
        Err(ErrorCode::InvalidMessage.into())
    }

}

/* 
  *
PROGRAM DATA STRUCTURES
    *
     */
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 10000)]
    pub my_account: Account<'info, MyAccount>, // field in the Initialize struct, of type Account<MyAccount> (Account holding a MyAccount), with lifetime 'info
    #[account(mut)]
    pub user: Signer<'info>, // field in the struct of type Signer with lifetime 'info
    pub system_program: Program <'info, System>,
}


// Base account
#[account]
pub struct MyAccount {
    pub total_messages: u64,
    pub messages: Vec<Message>,
}


// User


// Message - not its own account
#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct Message {
    pub id: String, // SHA256 of the parameters
    pub text: String, // TODO figure out how to put a character limit on here
    // pub latitude: f32,
    // pub longitude: f32,
    pub timestamp: i64,
    pub score: i8,
    pub user_pubkey: Pubkey
}

/* 
  *
FUNCTION CONTEXTS
    *
     */

#[derive(Accounts)]
pub struct CRUDMessage<'info> {
    #[account(mut)]
    pub my_account: Account<'info, MyAccount>,
    #[account(mut)]
    pub user: Signer<'info>, // TODO once we have user accounts
}


/* 
  *
 PROGRAM ERRORS
   *
    */

#[error]
pub enum ErrorCode {
    #[msg("The given message ID does not exist.")]
    InvalidMessage
}