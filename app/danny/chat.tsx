"use client"
import React, { useState } from "react"
import "./chat.css"
import Image from "next/image"
import { outdent } from "outdent"

type Side = "left" | "right"

type Message = {
  name: string
  img: "bot" | "person"
  side: Side
  date: Date
  text: string
}
function formatDate(date: Date) {
  const h = "0" + date.getHours()
  const m = "0" + date.getMinutes()

  return `${h.slice(-2)}:${m.slice(-2)}`
}

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null)

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (selectedFile) {
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
    }
  }

  return (
    <div className="file-upload">
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!selectedFile}>
        Upload
      </button>
      {selectedFile && <p>Selected file: {selectedFile.name}</p>}
    </div>
  )
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
  )
}

const BOT_IMG = "bot"
const PERSON_IMG = "person"
const PERSON_NAME = "Confident-Ally"
const DEFAULT_CONTEXT =
  "I'm applying for a job as a software engineer at Meta. I have enough experience but I get nervous in interviews. I've uploaded my CV."

type Panellist = {
  img: "bot" | "person"
  name: string
  description: string
  role: "boss" | "assistant"
  color: "red" | "orange" | "green"
}

export const Chat = () => {
  const [roleplaySetup, setRoleplaySetup] = useState<string>(DEFAULT_CONTEXT)
  const [msgText, setMsgText] = useState("")
  const [isInitialised, setIsInitialised] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [panellists, setPanellists] = useState<Panellist[]>([])

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
    } catch (error) {
      console.error("There has been a problem with your fetch operation:", error)
    }
  }

  function appendMessage(message: Message) {
    setMessages((prev) => [...prev, message])
  }

  async function remoteBotResponse(message: Message) {
    try {
      const response = await fetch("/api/chat.submit", {
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
      appendMessage({
        name: data.character.name,
        img: BOT_IMG,
        side: "left",
        text: data.message,
        date: new Date(),
      })
    } catch (error) {
      console.error("There has been a problem with your fetch operation:", error)
    }
  }

  return (
    <div>
      {!isInitialised && (
        <>
          <section className="msger">
            <header className="msger-header">
              <div className="msger-header-options">
                <span>
                  <i className="fas fa-cog"></i>
                </span>
              </div>
            </header>
            <form
              className="msger-inputarea"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!roleplaySetup) return

                setIsInitialised(true)
                initChat(roleplaySetup)
              }}
            >
              <textarea
                className="msger-input text-black"
                style={{ margin: "auto" }}
                value={roleplaySetup}
                onChange={(e) => setRoleplaySetup(e.target.value)}
              />
              <button type="submit" className="msger-send-btn">
                Send
              </button>
            </form>
          </section>
          <FileUpload />
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
            <Image
              priority
              src={`/${panellist?.img}.svg`}
              style={{ color: panellist?.color }}
              className="mt-2 ml-2"
              width={30}
              height={30}
              color={panellist?.color}
              alt="Follow us on Twitter"
            />
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

          <main style={{ maxHeight: "500px" }} className="msger-chat overflow-y-scroll ">
            {messages.map(Msg)}
          </main>

          <form
            className="msger-inputarea"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!msgText) return

              appendMessage({
                name: PERSON_NAME,
                img: PERSON_IMG,
                side: "right",
                text: msgText,
                date: new Date(),
              })
              // TODO: see if wait is required here
              setMsgText("")

              remoteBotResponse({
                name: PERSON_NAME,
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
          </form>
        </section>
      )}
    </div>
  )
}
