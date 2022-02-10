export function WalletConnectButton(props) {
    const {connectWallet, setWalletAddress} = props;
    return (
  <div>
    <button
      className="cta-button connect-wallet-button"
      onClick={(e) => {
        connectWallet(setWalletAddress);
      }}
    >
      Connect to Wallet
    </button>
    <p>
      {" "}
      Don't have a wallet? Install <a href="https://phantom.app/">
        {" "}
        Phantom{" "}
      </a>{" "}
      and load up some SOL!{" "}
    </p>
  </div>
)
}
