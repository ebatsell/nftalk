import React from "react";
import "./Message.css";

const Message = (props) => {
  // const { profilePicPath, messageText, likes, dateStr } = props;
  const { upvoteCallback, deleteCallback, profilePicPath, messageText, likes, /*shareIconPath,*/ trashIconPath, likeIconPath} = props;
  const msg = props.message;
  const date = new Date(msg.timestamp.toNumber() * 1000);
  const dateStr = date.toLocaleString();

  return (
    <div className="message">
      <img className="download-1" src={profilePicPath} alt="Profile pic" />
      <div className="this-is-a-post quando-normal-black-12px">{messageText}</div>
      <div className="flex-col">
        <div className="number quando-normal-black-12px">
          {likes}
          <div onClick={(e) => {e.preventDefault(); upvoteCallback(msg.id)}} className="group-1" style={{ backgroundImage: `url(${likeIconPath})` }}/>
        </div>
        <div className="icon-div">
          {/* <img className="solid-communication-share" src={shareIconPath} alt="Share it" /> */}
          <img onClick={(e) => {e.preventDefault(); deleteCallback(msg.id)}} className="solid-interface-trash-alt" src={trashIconPath} alt="Delete it" />
          <p className="x1032am-jan-12-2021">{dateStr}</p>
        </div>
      </div>
    </div>
  );
}

export default Message;
