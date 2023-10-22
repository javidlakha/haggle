"use client"
import Image from "next/image"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faCrow } from "@fortawesome/free-solid-svg-icons"
import { Chat } from "./chat"

export default function Home() {
  return (
    <main className="flex max-h-screen flex-col items-center justify-between">
      <div className="z-10 w-full items-center inline-block justify-between gap-10 font-mono text-sm lg:flex">
        <Chat />
        <div className="color-black h-screen w-2/5 bg-gray-500 items-center inline-block p-4 py-16">
          <Image
            priority
            src={`/haggle.png`}
            className="mt-2 ml-2 pb-5"
            width={270}
            height={30}
            alt="Follow us on Twitter"
          />
          Welcome to Haggle where you can practice your communication skills in challenging situations.
          <div>
            <Link style={{ position: "fixed", bottom: 0 }} href="parrot">
              <FontAwesomeIcon icon={faCrow} size="xl" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
