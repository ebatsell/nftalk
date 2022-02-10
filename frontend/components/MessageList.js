import React, {useRef, useEffect} from "react";
import Message from "./Message";

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

export default MessageList;
