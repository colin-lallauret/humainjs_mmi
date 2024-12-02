import React, { useEffect, useRef, useState } from "react";
import ReactWebcam from "react-webcam";
import { io } from "socket.io-client";

const FPS = 4;
const URL = "http://localhost:3000";
const socket = io(URL, {
  transports: ["websocket"],
});

const liste_emoji = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😲",
  neutral: "😐",
  fear: "😨",
};

export function Webcam() {
  const webcamRef = useRef();
  const canvasRef = useRef();
  const [result, setResult] = useState({});
  const [emotion, setEmotion] = useState("");

  useEffect(() => {
    const snap = () => webcamRef?.current?.getScreenshot();

    socket.on("connect", () => {
      console.log("connected", socket.id);
    });

    socket.on("data", (data) => {
      setResult(data);
      const emo = data?.face?.[0]?.emotion?.[0]?.emotion;
      setEmotion(emo);
    });

    const interval = setInterval(async () => {
      const img = snap();
      if (!img) return;

      const data = await fetch(img);
      const blob = await data.blob();
      const arraybuffer = await blob.arrayBuffer();

      socket.emit("image3", arraybuffer);
    }, 1000 / FPS);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = webcamRef.current?.video;

    if (video && result?.face?.[0]?.box) {
      const { videoWidth, videoHeight } = video;
      canvas.width = videoWidth;
      canvas.height = videoHeight;
      context.clearRect(0, 0, videoWidth, videoHeight);

      const [x, y, w, h] = result.face[0].box;

      const emoji = liste_emoji[emotion];
      const fontSize = Math.min(w, h) * 0.7;
      context.font = `${fontSize}px Arial`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(emoji, x + w / 2, y + h / 2);
    }
  }, [result, emotion]);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <ReactWebcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{ width: "100%", height: "auto" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
