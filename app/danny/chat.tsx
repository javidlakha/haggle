import React, { useState } from "react";
import "./chat.css";
import Image from "next/image";

type Side = "left" | "right";

type Message = {
  name: string;
  img: "bot" | "person";
  side: Side;
  text: string;
};
function formatDate(date: Date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

const Msg = (message: Message) => {
  return (
    <div className={`msg ${message.side}-msg`}>
      <div
        className="msg-img"
        // style="background-image: url(${img})" TODO
      >
        <Image
          priority
          src={`/${message.img}.svg`}
          className="mt-2 ml-2"
          width={30}
          height={30}
          alt="Follow us on Twitter"
        />
      </div>

      <div className="msg-bubble">
        <div className="msg-info">
          <div className="msg-info-name">{message.name}</div>
          <div className="msg-info-time">{formatDate(new Date())}</div>
        </div>

        <div className="msg-text">{message.text}</div>
      </div>
    </div>
  );
};

const BOT_MSGS = [
  "Hi, how are you?",
  "Ohh... I can't understand what you trying to say. Sorry!",
  "I like to play games... But I don't know how to play!",
  "Sorry if my answers are not relevant. :))",
  "I feel sleepy! :(",
];

const BOT_IMG = "bot";
const PERSON_IMG = "person";
const BOT_NAME = "Big Boss";
const PERSON_NAME = "Haggler";

export const Chat = () => {
  const [msgText, setMsgText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      name: BOT_NAME,
      img: BOT_IMG,
      side: "left",
      text: "Hi, welcome to this job interview?",
    },
    {
      name: PERSON_NAME,
      img: PERSON_IMG,
      side: "right",
      text: "Thanks, I'm super ready to go! Let me start",
    },
  ]);

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  async function botResponse(message: string) {
    try {
      const response = await fetch('/api/chat.submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    const msgText = data.message;
    const delay = msgText.split(" ").length * 100;

      setTimeout(() => {
        appendMessage({
          name: BOT_NAME,
          img: BOT_IMG,
          side: "left",
          text: msgText,
        });
      }, delay);
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }

  return (
    <section className="msger">
      <header className="msger-header">
        <div className="msger-header-title">HagglChat</div>
        <div className="msger-header-options">
          <span>
            <i className="fas fa-cog"></i>
          </span>
        </div>
      </header>

      <main
        style={{ maxHeight: "600px" }}
        className="msger-chat overflow-y-scroll "
      >
        {messages.map(Msg)}
      </main>

      <form
        className="msger-inputarea"
        onSubmit={(e) => {
          e.preventDefault();
          if (!msgText) return;

          appendMessage({
            name: PERSON_NAME,
            img: PERSON_IMG,
            side: "right",
            text: msgText,
          });
          // TODO: see if wait is required here
          setMsgText("");

          botResponse(msgText);
        }}
      >
        <input
          type="text"
          className="msger-input text-black"
          placeholder="Enter your message..."
          value={msgText}
          onChange={(e) => setMsgText(e.target.value)}
        />
        <button type="submit" className="msger-send-btn">
          Send
        </button>
      </form>
    </section>
  );
};
