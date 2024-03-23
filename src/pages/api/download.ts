import cors from "cors";
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import http from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";
import * as ytdl from "ytdl-core";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  },
});
server.listen(3001, () => {});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { url, format } = req.body;
    if (!url || !format) {
      return res.status(422).json({ message: "URL parameter is missing." });
    }

    try {
      const videoInfo = await ytdl.getInfo(url);
      const formats = ytdl.filterFormats(videoInfo.formats, "audioandvideo");
      if (formats.length > 0) {
        const videoStream = ytdl.downloadFromInfo(videoInfo, {
          format: formats[0],
          quality: "highestaudio",
        });
        const outputFilePath = `./public/${videoInfo.videoDetails.title}.mp4`;
        const writeStream = fs.createWriteStream(outputFilePath);

        videoStream.pipe(writeStream);

        videoStream.on("progress", (chunkLength, downloaded, total) => {
          const percent = downloaded / total;
          const realPercent = (percent * 100).toFixed(2);
          io.emit("downloadingState", { percent: realPercent });
        });

        videoStream.on("end", () => {
          io.close();
          fs.readFile(
            `./public/${videoInfo.videoDetails.title}.mp4`,
            (err, data) => {
              if (err) {
                console.error("Error reading file:", err);
                return res.status(500).json({ message: "Error reading file." });
              }
              if (format === "mp3") {
                ffmpeg.setFfmpegPath("./ffmpeg");
                const command = ffmpeg(
                  `./public/${videoInfo.videoDetails.title}.mp4`
                );

                command
                  .audioCodec("libmp3lame")
                  .audioBitrate(128)
                  .on("error", (err: any) => {
                    console.error("Erreur lors de la conversion :", err);
                  })
                  .save(`./public/${videoInfo.videoDetails.title}.mp3`);
                fs.unlink(`./${videoInfo.videoDetails.title}.mp4`, () => {});
              }
              res.status(200).send({
                message: `${videoInfo.videoDetails.title}.${format}`,
                videoInfo: videoInfo.videoDetails,
              });
            }
          );
        });
      } else {
        res
          .status(500)
          .json({ message: "No available formats for this video." });
      }
    } catch (error) {
      console.error("Error downloading video:", error);
      res.status(500).json({ message: "Error downloading video." });
    }
  } else {
    res.status(405).end();
  }
}
