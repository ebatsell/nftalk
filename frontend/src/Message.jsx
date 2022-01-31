import React, {useState} from "react";
import "./Message.css";
import { BigNumber } from "bignumber.js";
// import shareIconPath from "./assets/solid-communication-share@2x.png";
import trashIconPath from "./assets/solid-interface-trash-alt@2x.png";
import likeIconPath from "./assets/outline-status-heart-plus@2x.png";
import moneyIconPath from "./assets/dollar-sign.png";
import sendTipIconPath from "./assets/Send.png";

const Message = (props) => {
  const [isTipVisible, setIsTipVisible] = useState(false);
  const [tipValue, setTipValue] = useState(null);
  const { upvoteCallback, deleteCallback, tipCallback, messageText, likes, walletAddress} = props;
  const msg = props.message;
  const date = new Date(msg.timestamp.toNumber() * 1000);
  const dateStr = date.toLocaleString();

  const profilePic = process.env.PUBLIC_URL + "apes/" + Math.floor(msg.userPubkey.toBytes()[0] / 8) + ".png"
  const messageOwnedByUser = msg.userPubkey.toBase58() === walletAddress;
  console.log(msg.userPubkey.toBase58(), msg.text)

  const onTipInputChange = (e) => {
    console.log(e);
    const val = e.target.value;
    setTipValue(val);
  }


  return (
    <div className="message">
      <img className="download-1" src={profilePic} alt="Profile pic" />
      <div className="this-is-a-post quando-normal-black-12px">{messageText}</div>
      <div className="flex-col">
        <div className="number quando-normal-black-12px">
          {likes}
          <div
            onClick={(e) => {e.preventDefault(); upvoteCallback(msg.id)}}
            className="group-1"
            style={{ backgroundImage: `url(${likeIconPath})` }}
           />
        </div>
        <div className="icon-div">
          {/* <img className="solid-communication-share" src={shareIconPath} alt="Share it" /> */}
          <img
            onClick={(e) => {e.preventDefault(); setIsTipVisible(!isTipVisible);}}
            className="solid-interface-trash-alt"
            src={moneyIconPath}
            alt="Payment"
            hidden={messageOwnedByUser ? "hidden" : ""}
          />
          <input
            className="tip-input-box"
            placeholder="send tip (in SOL)"
            value={tipValue ? tipValue : ""}
            onChange={onTipInputChange}
            hidden={isTipVisible ? "" : "hidden"}
          />
          <img
            onClick={(e) => {e.preventDefault(); tipCallback(msg.id, BigNumber(tipValue))}}
            className="solid-interface-trash-alt"
            src={sendTipIconPath}
            alt="Send it"
            hidden={isTipVisible ? "" : "hidden"}
          />
          <img
            onClick={(e) => {e.preventDefault(); deleteCallback(msg.id)}}
            className="solid-interface-trash-alt"
            src={trashIconPath}
            alt="Delete it"
            hidden={messageOwnedByUser ? "" : "hidden"}
          />
          <p className="x1032am-jan-12-2021">{dateStr}</p>
        </div>
      </div>
    </div>
  );
}

export default Message;
