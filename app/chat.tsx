"use client"
import React, { useEffect, useRef, useState } from "react"
import "./chat.css"
import Image from "next/image"
import { PacmanLoader, PulseLoader } from "react-spinners"
import { FaRegSadCry } from "react-icons/fa"
import { BiConversation, BiBeer } from "react-icons/bi"
import { FcBusinesswoman, FcBusinessman } from "react-icons/fc"
import { Record } from "./record"

type Side = "left" | "right"

type MessageImg = "bot" | "person" | "Janet" | "Brian"

type Message = {
  name: string
  img: MessageImg
  side: Side
  date: Date
  text: string
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

function formatDate(date: Date) {
  const h = "0" + date.getHours()
  const m = "0" + date.getMinutes()

  return `${h.slice(-2)}:${m.slice(-2)}`
}

function nameToIcon(
  name: MessageImg,
  heading: boolean,
  className?: string,
): React.ReactNode {
  if (heading) {
    return (
      <Image
        priority
        src={`/${name}.jpeg`}
        // style={{ color: panellist?.color }}
        className="mt-2 ml-2"
        width={69}
        height={69}
        // color={panellist?.color}
        alt="Follow us on Twitter"
      />
    )
  }
  if (name === "Brian") {
    return <FcBusinessman size={30} className={className} />
  } else if (name === "Janet") {
    return <FcBusinesswoman size={30} className={className} />
  } else {
    return (
      <Image
        priority
        src={`/bot.svg`}
        // style={{ color: panellist?.color }}
        className="mt-2 ml-2"
        width={30}
        height={30}
        // color={panellist?.color}
        alt="Follow us on Twitter"
      />
    )
  }
}

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [CVLoading, setCVLoading] = useState(false)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (selectedFile) {
      setCVLoading(true)
      const formData = new FormData()
      formData.append("file", selectedFile)

      try {
        const response = await fetch("/api/chat.upload-doc", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Network response was not ok " + response.statusText)
        }

        const data = await response.json()
        console.log("File uploaded:", data.filename)
      } catch (error) {
        console.error("There has been a problem with your fetch operation:", error)
      }
      // wait half a second
      await new Promise((r) => setTimeout(r, 1000)).then((_) => setCVLoading(false))
    }
  }

  return (
    <div className="text-black file-upload h-20">
      <div className="flex">
        <input className="pl-3 pt-2" type="file" onChange={handleFileChange} />
        {CVLoading ? (
          <PacmanLoader color="#579ffb" />
        ) : (
          <button className="pt-2" onClick={handleUpload} disabled={!selectedFile}>
            Upload
          </button>
        )}
      </div>
      {selectedFile && <p className="pl-3">Selected file: {selectedFile.name}</p>}
    </div>
  )
}

const Msg = (message: Message, color?: string) => {
  return (
    <div className={`msg ${message.side}-msg`}>
      <div
        className="msg-img"
        // style="background-image: url(${img})" TODO
      >
        {nameToIcon(message.name, false, "mt-2 ml-2")}
        {/* <Image
          priority
          src={`/${message.img}.svg`}
          className="mt-2 ml-2"
          width={30}
          height={30}
          alt="Follow us on Twitter"
        /> */}
      </div>

      <div className="msg-bubble">
        <div className="msg-info">
          <div className="msg-info-name" style={{ color: color }}>
            {message.name}
          </div>
          <div className="msg-info-time">{formatDate(message.date)}</div>
        </div>

        <div className="msg-text">{message.text}</div>
      </div>
    </div>
  )
}

const BOT_IMG = "bot"
const PERSON_IMG = "person"
const PERSON_NAME = "Henry"
const DEFAULT_CONTEXT =
  "I'm applying for a job as a software engineer at Meta. I have enough experience but I get nervous in interviews. I've uploaded my CV."

type Panellist = {
  img: "bot" | "person"
  name: MessageImg
  description: string
  role: "boss" | "assistant"
  color: "red" | "orange" | "green"
}

const SCENARIOS = [
  {
    id: "interview",
    icon: BiBeer,
    description: "Panel job interview",
    text: "I'm applying for a job as a software engineer at Meta. I have enough experience but I get nervous in interviews. I've uploaded my CV.",
  },
  {
    id: "chat",
    icon: BiConversation,
    description: "Chat with strangers",
    text: "I'm approaching a stranger in a bar. I struggle with anxiety when talking to new people.",
  },
  {
    id: "sad",
    icon: FaRegSadCry,
    description: "Giving bad news",
    text: "I need to tell a friend some really bad news. I have no idea how to handle it.",
  },
]

export const Chat = () => {
  const [roleplaySetup, setRoleplaySetup] = useState<string>(DEFAULT_CONTEXT)
  const [personsName, setPersonsName] = useState<string>(PERSON_NAME)
  const [msgText, setMsgText] = useState("")
  const [isInitialised, setIsInitialised] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [panellists, setPanellists] = useState<Panellist[]>([])
  const [scenario, setScenario] = useState<string>("interview")
  const [chatLoading, setChatLoading] = useState(false)
  const messagesEndRef = useRef(null)

  async function initChat(message: string) {
    try {
      const response = await fetch("/api/chat.init", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_context: message }),
      })
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText)
      }
      const data = await response.json()
      setPanellists(data.characters)
      appendMessage({
        name: data.initial_message.character.name,
        img: BOT_IMG,
        side: "left",
        text: data.initial_message.content,
        date: new Date(),
      })
      speak(data.recording)
      setPersonsName(data.human_name)
    } catch (error) {
      console.error("There has been a problem with your fetch operation:", error)
    }
  }

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message])
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    })
    console.log(messages)
  }, [messages, messages.length])

  function speak(recording) {
    // Play response
    const arrayBuffer = base64ToArrayBuffer(recording);
    const audioContext = new window.AudioContext();
    let source;
    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
      source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start(0);
    });
  }
  async function remoteBotResponse(message: Message) {
    setChatLoading(true)
    try {
      const response = await fetch("/api/chat.submit-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: message.text }),
      })
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText)
      }
      const data = await response.json()

      speak(body.recording)

      appendMessage({
        name: data.character.name,
        img:
          data.character.name === "Janet"
            ? "janet"
            : data.character.name === "Brian"
            ? "brian"
            : BOT_IMG,
        side: "left",
        text: data.message,
        date: new Date(),
      })
    } catch (error) {
      console.error("There has been a problem with your fetch operation:", error)
    }
    setChatLoading(false)
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
      inline: "nearest",
    })
  }

  async function formSubmit(e) {
    if (e) {
      e.preventDefault()
    }
    if (!roleplaySetup) {
      console.log("no roleplay setup")
      return
    }

    setIsInitialised(true)
    initChat(roleplaySetup)
  }
  function appendVoiceResponse(response) {
    appendMessage({
      name: personsName,
      img: PERSON_IMG,
      side: "right",
      text: response.user_message,
      date: new Date(),
    })
    appendMessage({
      name: response.character.name,
      img: BOT_IMG,
      side: "left",
      text: response.message,
      date: new Date(),
    })
  }

  return (
    <div>
      {!isInitialised && (
        <>
          <div className="flex">
            {" "}
            {SCENARIOS.map((s) => (
              <div className="text-black m-4 border-gray-400" key={s.id}>
                <button
                  key={"button" + s.id}
                  onClick={() => {
                    setScenario(s.id)
                    setRoleplaySetup(s.text)
                  }}
                  style={{
                    border: scenario === s.id ? "2px solid black" : "2px solid white",
                  }}
                >
                  {<s.icon size={30} />}
                </button>
                <span className="ml-2">{s.description}</span>
              </div>
            ))}
          </div>
          <section className="msger" style={{ background: "#eee", maxWidth: "500px" }}>
            {/* <header className="msger-header">
              <div className="msger-header-options">
                <span>
                  <i className="fas fa-cog"></i>
                </span>
              </div>
            </header> */}
            <form
              className="msger-inputarea h-64 w-96 p-0"
              style={{
                borderTop: "none",
              }}
              onSubmit={formSubmit}
            >
              <textarea
                className="msger-input text-black  h-56 w-80 "
                style={{ margin: "auto" }}
                value={roleplaySetup}
                onChange={(e) => setRoleplaySetup(e.target.value)}
              />
              {/* <button type="submit" className="msger-send-btn mt-2 h-56">
                Send
              </button> */}
            </form>
          </section>
          {scenario === "interview" ? <FileUpload /> : <div className="h-20"></div>}
          <button
            type="submit"
            className="msger-send-btn mt-10 h-24 w-48 text-lg"
            onClick={formSubmit}
          >
            BEGIN
          </button>
        </>
      )}
      {panellists.map((panellist) => {
        return (
          // Little icons and names of the panellist
          <div
            key={panellist?.name}
            style={{ color: panellist?.color }}
            className={`text-${panellist?.color} flex items-center gap-2`}
          >
            <div className="mt-2 ml-2">{nameToIcon(panellist?.name, true)}</div>
            {/* <Image
              priority
              src={`/${panellist?.img}.svg`}
              style={{ color: panellist?.color }}
              className="mt-2 ml-2"
              width={30}
              height={30}
              color={panellist?.color}
              alt="Follow us on Twitter"
            /> */}
            <div className={`text-${panellist?.color}`}>{panellist?.name}</div>
            <div>: {panellist?.role}</div>
          </div>
        )
      })}
      {isInitialised && (
        <section className="msger">
          <header className="msger-header">
            <div className="msger-header-title">HagglChat</div>
            <div className="msger-header-options">
              <span>
                <i className="fas fa-cog"></i>
              </span>
            </div>
          </header>

          <main style={{ maxHeight: "500px" }} className="msger-chat overflow-y-scroll">
            {messages.map((m) =>
              Msg(m, panellists.filter((p) => p.name === m.name)[0]?.color),
            )}
            {chatLoading && (
              <div className="flex justify-center">
                <PulseLoader color="#b4b4b4" className="mt-4" />
              </div>
            )}
            <div className="pt-10" ref={messagesEndRef} />
          </main>

          <form
            className="msger-inputarea"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!msgText) return

              appendMessage({
                name: personsName,
                img: PERSON_IMG,
                side: "right",
                text: msgText,
                date: new Date(),
              })
              // TODO: see if wait is required here
              setMsgText("")

              remoteBotResponse({
                name: personsName,
                img: PERSON_IMG,
                side: "right",
                text: msgText,
                date: new Date(),
              })
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
            <Record appendMessages={appendVoiceResponse} />
          </form>
        </section>
      )}
    </div>
  )
}
