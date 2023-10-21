"use client";
import React, { useState } from "react";
import "./chat.css";
import Image from "next/image";
import { outdent } from "outdent";

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
const PERSON_NAME = "Confident-Ally";

type Panellist = {
  img: "bot" | "person";
  name: string;
  description: string;
  role: "boss" | "assistant";
  color: "red" | "orange" | "green";
};

const PANELLISTS: Panellist[] = [
  {
    img: "bot",
    name: "Big Boss",
    description:
      "This person is responsible for the final decision. They should only talk whenever the user talks about an animal or tries to end the interview",
    role: "assistant",
    color: "red",
  },
  {
    img: "bot",
    name: "Medium Boss",
    description:
      "This person is should talk whenever the user asks a question.",
    role: "assistant",
    color: "orange",
  },
  {
    img: "bot",
    name: "Small Boss",
    description:
      "This person should ask a follow-on question whenever the user answers a question.",
    role: "assistant",
    color: "green",
  },
];

async function whoShouldRespond(
  options: Panellist[],
  conversation: string,
  roleplaySetup?: string
): Promise<string> {
  const systemPrompt = outdent`
  From an ongoing conversation between a user and some panellists, decide which panellist should respond next.
  Here are the descriptions of the panellists:
  ${options.map((option) => `${option.name}: ${option.description}`).join("\n")}

  Here is the conversation so far:
  ${conversation}

  Return only the name of the panellist who should respond next. Ie one of: ${options
    .map((option) => option.name)
    .join(", ")}
  `;

  const whoShouldRespond = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-16k",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0,
      }),
    }
  );

  const responderData = await whoShouldRespond.json();
  return responderData.choices[0].message.content;
}

async function getResponse(conversation: Message[], roleplaySetup?: string) {
  const convoForResponseDecision = conversation
    .map((msg) => ({
      content: `${msg.name}: ${msg.text}`,
    }))
    .join("\n");
  const responder = await whoShouldRespond(
    PANELLISTS,
    convoForResponseDecision,
    roleplaySetup
  );

  console.log({ responder });

  const messagesForOpenAI = conversation.map((msg) => ({
    role: msg.side === "left" ? "assistant" : "user",
    content: msg.text,
  }));

  const finishedMessages = roleplaySetup
    ? [
        {
          role: "system",
          content: `${roleplaySetup} \n Now respond as ${responder}`,
        },
        ...messagesForOpenAI,
      ]
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
  return {
    text: message,
    name: responder,
  };
}

export const Chat = () => {
  const [roleplaySetup, setRoleplaySetup] = useState<string>(
    `You are an AI assistant helping the user to roleplay a job interview situation. You are playing the role of several panellists who are interviewing the user who is a job applicant. The panellists are: \n ${PANELLISTS.map(
      (panellist) => `${panellist.name}: ${panellist.description}`
    ).join("\n")}
    Your messages should be conversational and fit th tone of a job interviewer. They should be short and polite.`
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

  async function remoteBotResponse(message: string) {
    try {
      const response = await fetch("/api/chat.submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      const data = await response.json();
      const msgText = data.content;

      appendMessage({
        name: BOT_NAME,
        img: BOT_IMG,
        side: "left",
        text: msgText,
        date: new Date(),
      });
    } catch (error) {
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    }
  }

  function localBotResponse(message: Message) {
    const messagesToSubmit =
      messages[messages.length - 1].text === message.text
        ? messages
        : [...messages, message];
    getResponse(messagesToSubmit).then((res) => {
      appendMessage({
        name: res.name,
        img: BOT_IMG,
        side: "left",
        text: res.text,
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
      {PANELLISTS.map((panellist) => {
        return (
          // Little icons and names of the panellist
          <div
            key={panellist.name}
            style={{ color: panellist.color }}
            className={`text-${panellist.color} flex items-center gap-2`}
          >
            <Image
              priority
              src={`/${panellist.img}.svg`}
              style={{ color: panellist.color }}
              className="mt-2 ml-2"
              width={30}
              height={30}
              color={panellist.color}
              alt="Follow us on Twitter"
            />
            <div className={`text-${panellist.color}`}>{panellist.name}</div>
            <div>{panellist.description}</div>
          </div>
        );
      })}
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
          style={{ maxHeight: "500px" }}
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

            localBotResponse({
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
