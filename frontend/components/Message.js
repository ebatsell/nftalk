import React, {useState} from "react";
import { BigNumber } from "bignumber.js";
import { programs } from "@metaplex/js";
import Image from "next/image";
import styles from "./Message.module.css";
// const shareIconPath = "/images/solid-communication-share@2x.png";
const trashIconPath = "/images/solid-interface-trash-alt@2x.png";
const likeIconPath = "/images/outline-status-heart-plus@2x.png";
const moneyIconPath = "/images/dollar-sign.png";
const sendTipIconPath = "/images/Send.png";

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
  const apePic = "/images/apes/" + Math.floor(msg.userPubkey.toBytes()[0] / 8) + ".png"
  const [profilePicState, setProfilePic] = useState(apePic);

  const messageOwnedByUser = msg.userPubkey.toBase58() === walletAddress;

  // Async set profile pic 
  selectProfilePic(connection, msg.userPubkey, setProfilePic);

  const onTipInputChange = (e) => {
    const val = e.target.value;
    setTipValue(val);
  }
  return (
    <div className={styles.message}>
      <img
        className={styles.download1}
        src={profilePicState}
        alt="Profile pic"
        // width={65} // tried getting <Image> to work but struggled
        // height={65}
        // layout="fixed"
        // objectFit="none"
      />
      <div className={`${styles.thisIsAPost} quando-normal-black-12px`}>{messageText}</div>
      <div className={styles.flexCol}>
        <div className={`${styles.number} quando-normal-black-12px`}>
          {likes}
          <img
            onClick={(e) => {e.preventDefault(); upvoteCallback(msg.id)}}
            className={styles.group1}
            src={likeIconPath}
            width={24}
            height={24}
           />
        </div>
        <div className={styles.iconDiv}>
          {/* <img className="solid-communication-share" src={shareIconPath} alt="Share it" /> */}
          <img
            onClick={(e) => {e.preventDefault(); setIsTipVisible(!isTipVisible);}}
            className={styles.solidInterfaceTrashAlt}
            width={24}
            height={24}
            src={moneyIconPath}
            alt="Payment"
            hidden={messageOwnedByUser ? "hidden" : ""}
          />
          <input
            className={styles.tipInputBox}
            placeholder="send tip (in SOL)"
            value={tipValue ? tipValue : ""}
            onChange={onTipInputChange}
            hidden={isTipVisible ? "" : "hidden"}
          />
          <img
            onClick={(e) => {e.preventDefault(); tipCallback(msg.id, BigNumber(tipValue))}}
            className={styles.solidInterfaceTrashAlt}
            src={sendTipIconPath}
            alt="Send it"
            hidden={isTipVisible ? "" : "hidden"}
            width={24}
            height={24}
          />
          <img
            onClick={(e) => {e.preventDefault(); deleteCallback(msg.id)}}
            className={styles.solidInterfaceTrashAlt}
            src={trashIconPath}
            alt="Delete it"
            hidden={messageOwnedByUser ? "" : "hidden"}
            width={24}
            height={24}
          />
          <p className={styles.x1032amJan122021}>{dateStr}</p>
        </div>
      </div>
    </div>
  );
}

export default Message;
