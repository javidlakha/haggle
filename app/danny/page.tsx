'use client'
import Image from "next/image";
import Link from "next/link";
import { Chat } from "./chat";

export default function Home() {
  return (
    <main className="flex max-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <Chat/>
        <div>
          Welcome to Haggle where you can practice your skills
        </div>
      </div>
    </main>
  );
}
