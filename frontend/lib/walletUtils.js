export async function checkIfWalletIsConnected(setWalletAddress) {
  try {
    const { solana } = window;

    if (solana) {
      if (solana.isPhantom) {
        console.log("Phantom wallet found!");
        const response = await solana.connect({ onlyIfTrusted: true });
        console.log("Connected with public key!", solana.publicKey.toString());
        setWalletAddress(response.publicKey.toString());
      }
    } else {
      alert("Solana object not found! Get a Phantom Wallet 👻");
    }
  } catch (error) {
    console.error(error);
  }
}

export async function connectWallet(setWalletAddress) {
  const { solana } = window;
  if (solana) {
    const response = await solana.connect();
    setWalletAddress(response.publicKey.toString());
  }
};
