export function InitializeAccountButton(props) {
    return (
    <div className="connected-container">
      <button
        className="cta-button submit-gif-button"
        onClick={props.createMessageAccount}
      >
        Do One-Time Initialization For Tweet Program Account
      </button>
    </div>
  );
}