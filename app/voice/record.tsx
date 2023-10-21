'use client'

import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faBug,
  faMicrophone,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons"
import { faStop } from "@fortawesome/free-solid-svg-icons"
import { useReactMediaRecorder } from "react-media-recorder"

import "./record.css"


enum RecordingStatus {
  ERROR = "error",
  PENDING = "pending",
  RECORDING = "recording",
  PROCESSING = "processing",
}


export function Record() {
  const [recordingStatus, setRecordingStatus] = useState(
    RecordingStatus.PENDING,
  )

  const uploadRecording = async (recording: Blob) => {
    setRecordingStatus(RecordingStatus.PROCESSING)

    try {
      // Upload file
      const formData = new FormData();
      formData.append('recording', recording);
      const response = await fetch('/api/upload-voice', {
          method: 'POST',
          body: formData,
      });

      clearBlobUrl()
      setRecordingStatus(RecordingStatus.PENDING)
    } catch (err) {
      setRecordingStatus(RecordingStatus.ERROR)
    }
  }

  const { clearBlobUrl, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({
      audio: true,
      mediaRecorderOptions: { mimeType: "audio/wav" },
      onStart: () => setRecordingStatus(RecordingStatus.RECORDING),
      onStop: (_, recording) => uploadRecording(recording),
      video: false,
    })

  const retry = async () => {
    if (!mediaBlobUrl) return
    const audio_blob = await fetch(mediaBlobUrl).then((r) => r.blob())
    uploadRecording(audio_blob)
  }

  if (recordingStatus === RecordingStatus.ERROR)
    return (
      <div className="record-audio-button">
        <button
          onClick={retry}
          title="Retry"
        >
          <FontAwesomeIcon
            icon={faBug}
            size="xl"
          />
          <div className="button-text">
            An error occurred. Click here to retry
          </div>
        </button>
      </div>
    )

  if (recordingStatus === RecordingStatus.RECORDING)
    return (
      <div className="record-audio-button">
        <button
          onClick={stopRecording}
          title="Stop recording"
        >
          <FontAwesomeIcon
            icon={faStop}
            size="xl"
          />
          <div className="button-text">Stop recording</div>
        </button>
      </div>
    )

  if (recordingStatus === RecordingStatus.PROCESSING)
    return (
      <div className="recording-status">
        <div>
          <FontAwesomeIcon
            icon={faSpinner}
            size="xl"
            spin={true}
          />
        </div>
        <div>Generating response</div>
      </div>
    )

  return (
    <div className="record-audio-button">
      <button
        onClick={startRecording}
        title="Record"
      >
        <FontAwesomeIcon
          icon={faMicrophone}
          size="xl"
        />
        <div className="button-text">Record</div>
      </button>
    </div>
  )
}
