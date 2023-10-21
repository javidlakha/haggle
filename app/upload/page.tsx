"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [image, setImage] = useState(null);
  const [createObjectURL, setCreateObjectURL] = useState(null);
  const router = useRouter();

  const uploadToClient = (event) => {
    if (event.target.files && event.target.files[0]) {
      const i = event.target.files[0];

      setImage(i);
      setCreateObjectURL(URL.createObjectURL(i));
    }
  };

  const uploadToServer = async () => {
    // TODO:
    // const body = new FormData();
    // body.append("file", image);
    // const response = await fetch("/api/file", {
    //   method: "POST",
    //   body,
    // });
    router.push("/danny");
  };

  return (
    <main className="flex max-h-screen flex-col items-center justify-between">
      <div className="z-10 w-full items-center inline-block justify-between gap-10 font-mono text-sm lg:flex">
        <div>
          <h4>Select Image</h4>
          <input type="file" name="myImage" onChange={uploadToClient} />
          <button
            className="btn btn-primary"
            type="submit"
            onClick={uploadToServer}
          >
            Send to server
          </button>
        </div>
        <img src={createObjectURL} />

        <div className="color-black h-screen w-2/5 bg-gray-500 items-center inline-block p-4 py-16">
          <Image
            priority
            src={`/haggle.png`}
            className="mt-2 ml-2 pb-5"
            width={270}
            height={30}
            alt="Follow us on Twitter"
          />
          Welcome to Haggle where you can practice your skills
        </div>
      </div>
    </main>
  );
}
