import React, {useState} from "react";
import "./Message.css";
import { BigNumber } from "bignumber.js";
// import shareIconPath from "./assets/solid-communication-share@2x.png";
import trashIconPath from "./assets/solid-interface-trash-alt@2x.png";
import likeIconPath from "./assets/outline-status-heart-plus@2x.png";
import moneyIconPath from "./assets/dollar-sign.png";
import sendTipIconPath from "./assets/Send.png";
import { programs } from "@metaplex/js";


const selectProfilePic = async (connection, userPubkey, setProfilePic) => {
  const getMetadata = async () => {
    const tokenMetadata = await programs.metadata.Metadata.findDataByOwner(connection, userPubkey);
    return tokenMetadata;
  }

  /* I hate javascript */
  // Goal: select first image that works
  const result = await getMetadata();
  // Make ordering consistent
  result.sort((a, b) => (a.mint < b.mint));
  for (let i in result) {
    const nftUri = result[i].data.uri;
    try {
      const fetchResult = await fetch(nftUri, {accept: "application/json"});
      if (fetchResult.ok) {
        const image = (await fetchResult.json()).image;
        if (image && image.length !== 0 && image !== "") {
          setProfilePic(image);
          return;
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  // If we didn't find one from the wallet, use the Ape (already set as default)
  return;
}

const Message = (props) => {
  const { upvoteCallback, deleteCallback, tipCallback, messageText, likes, walletAddress, connection} = props;
  const msg = props.message;
  const date = new Date(msg.timestamp.toNumber() * 1000);
  const dateStr = date.toLocaleString();

  const [isTipVisible, setIsTipVisible] = useState(false);
  const [tipValue, setTipValue] = useState(null);
  const apePic = process.env.PUBLIC_URL + "apes/" + Math.floor(msg.userPubkey.toBytes()[0] / 8) + ".png"
  const [profilePicState, setProfilePic] = useState(apePic);

  const messageOwnedByUser = msg.userPubkey.toBase58() === walletAddress;

  // Async set profile pic 
  selectProfilePic(connection, msg.userPubkey, setProfilePic);

  const onTipInputChange = (e) => {
    const val = e.target.value;
    setTipValue(val);
  }

  return (
    <div className="message">
      <img className="download-1" src={profilePicState} alt="Profile pic" />
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
