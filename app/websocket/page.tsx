'use client'

import useWebSocket from "react-use-websocket"

const WEB_SOCKET_URL = "ws://localhost:8000/ws"

export default function Response() {
  const { sendJsonMessage: messageServer } = useWebSocket(WEB_SOCKET_URL, {
    onMessage: async (event: MessageEvent) => {
      const { stop, update } = JSON.parse(event["data"])

      console.log(update)
    },
  })

  const sendMessage = () => {
    messageServer({
      'hello': 'world',
    })
  }

  return (
    <main>
      <div>
        <div>
          <button onClick={sendMessage}>Send Message</button>
        </div>
      </div>
    </main>
  );
}
