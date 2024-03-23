"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypewriterEffectSmooth } from "@/components/ui/typewriter-effect";
import AOS from "aos";
import "aos/dist/aos.css";
import Image from "next/image";
import * as React from "react";
import { io } from "socket.io-client";
import * as ytdl from "ytdl-core";

interface VideoData {
  url: string;
  format: "mp4" | "mp3";
}

export default function Home() {
  const [videoData, setVideoData] = React.useState<VideoData | null>(null);
  const [oldVideoData, setOldVideoData] = React.useState<Boolean>(false);
  const [videoDownloadData, setVideoDownloadData] =
    React.useState<ytdl.MoreVideoDetails | null>(null);
  const [downloadProgress, setDownloadProgress] = React.useState(0);
  const [fileData, setFileData] = React.useState(null);
  React.useEffect(() => {
    AOS.init({ duration: 1200 });
  });

  const handleInput = (key: string, value: any) => {
    if (oldVideoData) {
      setOldVideoData(false);
      setVideoDownloadData(null);
    }
    setVideoData((prevState: any) => {
      if (prevState === null) {
        return { [key]: value };
      } else {
        return { ...prevState, [key]: value };
      }
    });
  };
  const handleDownload = async () => {
    const file = await fetch(`http://localhost:3000/${fileData}`);
    const blob = await file.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileData}`;
    link.click();
    setOldVideoData(true);
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const socket = io("http://localhost:3001");
    socket.on("downloadingState", (value) => {
      setDownloadProgress(Number(value.percent));
    });
    fetch("http://localhost:3000/api/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(videoData),
    }).then(async (response) => {
      socket.close();
      setDownloadProgress(0);
      const fileFetch = await response.json();
      const fileName = fileFetch.message;
      setVideoDownloadData(fileFetch.videoInfo);
      return setFileData(fileName);
    });
  };
  const words = [
    {
      text: "THE",
    },
    {
      text: "Youtube",
    },
    {
      text: "video",
    },
    {
      text: "downloader",
    },
    {
      text: "for",
    },
    {
      text: "you.",
      className: "text-[#FF3333] dark:text-[#FF3333]",
    },
  ];
  return (
    <main className="bg-[#1a1a1a] flex flex-col items-center h-screen justify-between">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Anta&family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap"
        rel="stylesheet"
      />
      <div
        data-aos="fade-down"
        className="border border-transparent overflow-hidden w-auto p-[1px] h-16 rounded-full hidden md:flex z-50 absolute top-4 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
      >
        <span className="absolute inset-[-1100%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#FF0000_0%,#FF3333_50%,#FF0000_100%)]" />
        <ul className="inline-flex flex-col md:flex-row md:space-x-2 px-3 py-1 cursor-pointer rounded-full backdrop-blur-3xl rtl:space-x-reverse z-50 bg-[#1a1a1a] h-full w-full items-center justify-center">
          <li className="px-3 block ml-px text-white">Download</li>
          <li className="px-3 block text-white">Contact</li>
          <li className="px-3 relative right-px block text-white">Join us</li>
        </ul>
      </div>
      <form
        onSubmit={handleSubmit}
        className="relative w-72 left-2 justify-center items-center"
      >
        <Label
          htmlFor="videoLink"
          className="relative top-36 text-white text-lg left-2"
        >
          Enter a video link to download.
        </Label>
        <Input
          type="link"
          placeholder="Video link"
          id="videoLink"
          onChange={(e) => {
            handleInput("url", e.target.value);
          }}
          className="w-72 h-12 absolute top-48 z-50 text-center text-xl"
        />
        <Select onValueChange={(value) => handleInput("format", value)}>
          <SelectTrigger className="w-72 relative top-56 z-50">
            <SelectValue placeholder="Select a format" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Format</SelectLabel>
              <SelectItem value="mp4">MP4</SelectItem>
              <SelectItem value="mp3">MP3</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <button
          type="submit"
          style={{ fontFamily: "JetBrains Mono, sans-serif" }}
          className="shadow-[0_4px_14px_0_,#FF0000] w-24 h-8 hover:shadow-[0_6px_20px_#FF0000] hover:bg-[#FF0000] px-8 py-2 bg-[#FF0000] rounded-md text-white font-light text-sm transition duration-200 ease-linear relative top-60 text-center z-50 left-24"
        >
          <span className="relative bottom-px">-&gt;</span>
        </button>
      </form>
      {downloadProgress > 0 && (
        <Progress
          value={downloadProgress}
          className="w-64 absolute top-96 bg-black border-none"
        />
      )}
      {videoDownloadData && (
        <div className="flex items-center justify-center absolute flex-col top-96 gap-y-8">
          <Image
            src={videoDownloadData.thumbnails[0].url}
            alt={`${videoDownloadData.title} thumbnail`}
            width={200}
            height={200}
            className="w-96"
          />
          <button
            onClick={handleDownload}
            style={{ fontFamily: "JetBrains Mono, sans-serif" }}
            className="shadow-[0_4px_14px_0_,#FF0000] w-28 h-8 hover:shadow-[0_6px_20px_#FF0000] hover:bg-[#FF0000] px-8 py-2 bg-[#FF0000] rounded-md text-white font-light text-sm transition duration-200 ease-linear text-center z-50"
          >
            <span className="relative text-center bottom-px right-2">
              Download
            </span>
          </button>
        </div>
      )}
      <div className="flex gap-28 items-center justify-center absolute bottom-56">
        <div data-aos="fade-right">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/e/ef/Youtube_logo.png"
            alt="youtube logo"
            width={200}
            height={200}
            className="w-64"
          />
        </div>
        <div>
          <TypewriterEffectSmooth words={words} />
        </div>
      </div>
    </main>
  );
}
