import React, { useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import "./App.css";
import idl from "./idl.json";
import { Connection, PublicKey, sendAndConfirmRawTransaction, Transaction, TransactionInstruction,LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, Provider, web3  } from "@project-serum/anchor";
import { Buffer } from "buffer";
// import keypair from "./keypair.json";
import Message from "./Message";
import { BigNumber } from "bignumber.js";

window.Buffer = Buffer;

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const keypair = JSON.parse(process.env.REACT_APP_KEYPAIR);

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(keypair._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = Keypair.fromSecretKey(secret);
// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devnet.
// Hacky way to get around CORS error
const network = 'https://solana-api.projectserum.com/'
// const network = clusterApiUrl('mainnet-beta');
// const network = clusterApiUrl('devnet');
// const network = "http://localhost:8899";

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};


// Change this up to be your Twitter if you want.
const TWITTER_HANDLE = "evanbat_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}/status/1486097274245689344`;

const App = () => {
  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [messageList, setMessageList] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log("Phantom wallet found!");
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            "Connected with public key!",
            solana.publicKey.toString(),
          );
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert("Solana object not found! Get a Phantom Wallet 👻");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
   * Let's define this method so our code doesn't break.
   * We will write the logic for this next!
   */
  const connectWallet = async () => {
    const { solana } = window;
    if (solana) {
      const response = await solana.connect();
      setWalletAddress(response.publicKey.toString());
    }
  };

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const createMessageAccount = async () => {
    // Calls "Initialize"
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.initialize({
        accounts: {
          myAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getMessageList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const sendMessage = async () => {
    if (inputValue.length === 0) {
      console.log("No message given");
      return;
    }
    setInputValue("");
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.postMessage(inputValue, {
        accounts: {
          myAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });

      console.log("Message Sent to Program, ", inputValue);

      await getMessageList();
    } catch (error) {
      console.log("Error sending: ", error);
    }
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    );
    return provider;
  };

  const getMessageList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.myAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setMessageList(account.messages);
    } catch (error) {
      console.log("Error in getMessageList: ", error);
      setMessageList(null);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.deleteMessage(messageId, {
        accounts: {
          myAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });

      messageList.splice(
        messageList.findIndex((m) => m.id === messageId),
        1
      );
      setMessageList(messageList); // Set react state
      renderConnectedContainer();
      await getMessageList();
    } catch (error) {
      console.log("Error in deleting message: ", messageId);
    }
  };

  const upvoteMessage = async (messageId) => {
    // Same pattern - try/catch of the upvote message call
    // return null;
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.upvoteMessage(messageId, {
        accounts: {
          myAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });

      let messageIdx = messageList.findIndex((m) => m.id === messageId);
      messageList[messageIdx].score += 1;
      setMessageList(messageList); // Set react state
      renderConnectedContainer();
      await getMessageList();
    } catch (error) {
      console.log("Error in deleting message: ", messageId);
    }
  };

  const tipMessage = async (messageId, tipAmount) => {
    console.log(tipAmount);
    if (tipAmount.isNaN()) {
      console.log("Can't send an empty or invalid amount");
      alert("Attempting to send an empty or invalid amount");
      return;
    }
    // Same pattern - try/catch of the upvote message call
    // return null;
    const provider = getProvider();
    // const program = new Program(idl, programID, provider);

    let message = messageList.find((m) => m.id === messageId);
    const payer = provider.wallet.publicKey; // Current user
    const payerInfo = await provider.connection.getAccountInfo(payer);
    const recipient = message.userPubkey;
    const memo = "Tip for your post on NFTalk"; // This goes on-chain

    // Convert amount to lamports
    tipAmount = tipAmount.times(LAMPORTS_PER_SOL).integerValue(BigNumber.ROUND_FLOOR);

    // Check that payer has enough funds
    const lamports = tipAmount.toNumber();
    if (lamports > payerInfo.lamports) {
      throw new Error('insufficient funds');
    }

    const instruction = SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: recipient,
      lamports,
    });

    let tx = new Transaction();
    // If a memo is provided, add it to the transaction before adding the transfer instruction
    if (memo != null) {
      tx.add(
          new TransactionInstruction({
              programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'), // Memo program ID
              keys: [],
              data: Buffer.from(memo, 'utf8'),
          })
      );
    }

    // // Create transaction reference and push it to the NFTalk data account
    // const tipReference = new Keypair().publicKey;
    // const saveReferenceInstruction = program.instruction.saveTipReference(message.id, tipReference, {
    //   accounts: {
    //     myAccount: baseAccount.publicKey,
    //     user: provider.wallet.publicKey,
    //   }, 
    // });
    
    // instruction.keys.push({ pubkey: tipReference, isWritable: false, isSigner: false });
    // tx.add(saveReferenceInstruction);
    tx.add(instruction);

    // Adds requisite fields to make the tx object complete
    tx.feePayer = provider.wallet.publicKey;
    tx.recentBlockhash = (await provider.connection.getRecentBlockhash()).blockhash;
    tx = await provider.wallet.signTransaction(tx);
    // Send the transaction to the network
    const txSignature = await sendAndConfirmRawTransaction(provider.connection, tx.serialize());
    console.log(`https://solscan.io/tx/${txSignature}`);
    // Send txSignature to tweet data?
  };

  /*
   * We want to render this UI when the user hasn't connected
   * their wallet to our app yet.
   */
  const renderNotConnectedContainer = () => (
    <div>
      <button
        className="cta-button connect-wallet-button"
        onClick={connectWallet}
      >
        Connect to Wallet
      </button>
      <p> Don't have a wallet? Install <a href="https://phantom.app/"> Phantom </a> and load up some SOL! </p>
    </div>
  );

  const renderConnectedContainer = () => {
    if (messageList === null) {
      console.log("Rendering initialization buton");
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createMessageAccount}
          >
            Do One-Time Initialization For Tweet Program Account
          </button>
        </div>
      );
    } else {
      console.log("Rendering grid and submit button");
      // console.log(messageList);

      const provider = getProvider();
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <input
              type="text"
              placeholder="Say something to the world"
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <MessageList
            messageList={messageList}
            deleteCallback={deleteMessage}
            upvoteCallback={upvoteMessage}
            tipCallback={tipMessage}
            walletAddress={walletAddress}
            connection={provider.connection}
          />
        </div>
      );
    }
  };

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("Fetching post list...");

      // Call Solana program here.
      getMessageList(); 
    }
  // eslint-disable-next-line
  }, [walletAddress]);

  return (
    <div className="App">
      <div className={walletAddress ? "authed-container" : "container"}>
        <div className="container">
          <div className="header-container">
            <p className="header">Evan's Twitter Clone</p>
            <p className="sub-text">
              ✨ non fungible tweets ✨
            </p>
            {/* Render your connect to wallet button right here */}
            {!walletAddress
              ? renderNotConnectedContainer()
              : renderConnectedContainer()}
          </div>
          <div className="footer-container">
            <img
              alt="Twitter Logo"
              className="twitter-logo"
              src={twitterLogo}
            />
            <a
              className="footer-text"
              href={TWITTER_LINK}
              target="_blank"
              rel="noreferrer"
            >{`built by @${TWITTER_HANDLE}`}</a>
          </div>
        </div>
      </div>
    </div>
  );
};


const messageData = {
    profilePicPath: "./assets/apes/",
};

const MessageList = (props) => {
    const messageProps = messageData;
    return (
    <div className="gif-grid">
      {props.messageList.map((msg, index) =>
        <Message
          key={index}
          message={msg}
          upvoteCallback={props.upvoteCallback}
          deleteCallback={props.deleteCallback}
          tipCallback={props.tipCallback}
          profilePicPath={messageProps.profilePicPath}
          messageText={msg.text}
          likes={msg.score}
          walletAddress={props.walletAddress}
          connection={props.connection}
        />
      )}
    </div>
  );
};

export default App;
