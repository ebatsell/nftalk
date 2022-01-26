const assert = require("assert");
const anchor = require('@project-serum/anchor');
const { SystemProgram, PublicKey } = anchor.web3;

describe('nftalk', () => {

  const provider = anchor.Provider.env();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  const program = anchor.workspace.Nftalk;
  const myUserAccount = anchor.web3.Keypair.generate();

  it('Is initialized!', async () => {
    const tx = await program.rpc.initialize({
      accounts: {
        myAccount: myUserAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [myUserAccount],
    });
    console.log("Your transaction signature", tx);
  });

  it('Post message: ', async () => {
    console.log(myUserAccount);
    const tx = await program.rpc.postMessage("My first test message haha :)",
      {
        accounts: {
          myAccount: myUserAccount.publicKey,
          user: provider.wallet.publicKey,
        },
        // signers: [myUserAccount]
      }
    );
    // Call the account.
    account = await program.account.myAccount.fetch(myUserAccount.publicKey);
    console.log('👀 Post Count', account.totalMessages.toString())
    assert.ok(account.totalMessages.toString() === '1');
    let firstMessage = account.messages[0];
    assert.notEqual(null, firstMessage)
    assert.ok("My first test message haha :)" === firstMessage.text);
    assert.ok(0 === firstMessage.score);
    assert.notEqual(null, firstMessage.timestamp);

    // Access gif_list on the account!
    console.log('👀 GIF List', account.messages)
  });

  it('Post and delete another message: ', async () => {
    console.log(myUserAccount);
    const tx = await program.rpc.postMessage("My second test message haha :)",
      {
        accounts: {
          myAccount: myUserAccount.publicKey,
          user: provider.wallet.publicKey,
        },
        // signers: [myUserAccount]
      }
    );

    account = await program.account.myAccount.fetch(myUserAccount.publicKey);
    let secondMessage = account.messages.find( ({text}) => text === "My second test message haha :)");

    // Attempt to delete with the wrong user (all zeros)
    const badKey = new PublicKey(0);
    try {
      const badDelTx = await program.rpc.deleteMessage(secondMessage.id,
        {
          accounts: {
            myAccount: myUserAccount.publicKey,
            user: badKey,
          },
        }
      );
      
    } catch (error) {
      console.log(error);
      assert.equal(error.message, "Signature verification failed");
    }

    // Check that message wasn't actually deleted
    account = await program.account.myAccount.fetch(myUserAccount.publicKey);
    secondMessage = account.messages.find( ({text}) => text === "My second test message haha :)");
    assert.notEqual(null, secondMessage);


    const delTx = await program.rpc.deleteMessage(secondMessage.id,
      {
        accounts: {
          myAccount: myUserAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      }
    );

    // Call the account.
    account = await program.account.myAccount.fetch(myUserAccount.publicKey);
    console.log('👀 Post Count', account.totalMessages.toString())
    assert.ok(account.totalMessages.toString() === '1');
    let onlyMessage = account.messages[0];
    assert.notEqual(null, onlyMessage)
    assert.ok("My first test message haha :)" === onlyMessage.text);
    assert.ok(0 === onlyMessage.score);
    assert.notEqual(null, onlyMessage.timestamp);

    // Access gif_list on the account!
    console.log('👀 Message List', account.messages)
  });

  it("Message too long", async () =>  {
    try {
      const tx = await program.rpc.postMessage(
        "My really long test message..................................................................................................................................................................................................................................................................................................................",
        {
          accounts: {
            myAccount: myUserAccount.publicKey,
            user: provider.wallet.publicKey,
          },
        }
      );
      assert.ok(false);
    } catch(error) {
      assert.equal(error.message, "301: The provided message text is too long. Maximum 240 Characters.");
    }
  });
});
