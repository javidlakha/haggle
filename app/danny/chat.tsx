import React, { useState } from "react";
import "./chat.css";
import Image from "next/image";

type Side = "left" | "right";

type Message = {
  name: string;
  img: "bot" | "person";
  side: Side;
  date: Date;
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
          <div className="msg-info-time">{formatDate(message.date)}</div>
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

async function getResponse(conversation: Message[], roleplaySetup?: string) {
  const messagesForOpenAI = conversation.map((msg) => ({
    role: msg.name === BOT_NAME ? "assistant" : "user",
    content: msg.text,
  }));
  const finishedMessages = roleplaySetup
    ? [{ role: "system", content: roleplaySetup }, ...messagesForOpenAI]
    : messagesForOpenAI;
  console.log({ finishedMessages });
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo-16k",
      messages: roleplaySetup
        ? [{ role: "system", content: roleplaySetup }, ...messagesForOpenAI]
        : messagesForOpenAI,
      temperature: 0,
    }),
  });
  const data = await response.json();
  const message = data.choices[0].message.content;
  console.log({ message });
  return message;
}

export const Chat = () => {
  const [roleplaySetup, setRoleplaySetup] = useState<string>(
    "You are an AI assistant helping the user to roleplay a job interview situation. You are the boss who is hosting the interview and the user is the job applicant"
  );
  const [msgText, setMsgText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      name: BOT_NAME,
      img: BOT_IMG,
      side: "left",
      text: "Hi, welcome to this job interview!",
      date: new Date(),
    },
    {
      name: PERSON_NAME,
      img: PERSON_IMG,
      side: "right",
      text: "Thanks, I'm super ready to go! Let me start",
      date: new Date(),
    },
  ]);

  // TODO: functionality to auto-scroll to the bottom after message submission and adding responses

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  function botResponse(message: Message) {
    const messagesToSubmit =
      messages[messages.length - 1].text === message.text
        ? messages
        : [...messages, message];
    getResponse(messagesToSubmit).then((res) => {
      appendMessage({
        name: BOT_NAME,
        img: BOT_IMG,
        side: "left",
        text: res,
        date: new Date(),
      });
    });
  }

  return (
    <div>
      <input
        className="text-black"
        value={roleplaySetup}
        onChange={(e) => setRoleplaySetup(e.target.value)}
      />
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
          onSubmit={async (e) => {
            e.preventDefault();
            if (!msgText) return;

            appendMessage({
              name: PERSON_NAME,
              img: PERSON_IMG,
              side: "right",
              text: msgText,
              date: new Date(),
            });
            // TODO: see if wait is required here
            setMsgText("");

            botResponse({
              name: PERSON_NAME,
              img: PERSON_IMG,
              side: "right",
              text: msgText,
              date: new Date(),
            });
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
    </div>
  );
};
