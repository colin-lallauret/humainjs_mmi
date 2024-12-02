import express from "express";
import { Socket } from "node:dgram";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

import * as Humanjs from "@vladmandic/human";

const config = {
  backend: "webgl",
  modelBasePath: "file://models/",
  emotion: { enabled: true },
  face: {
    detector: {
      maxDetected: 3,
    },
  },
};
const human = new Humanjs.Human(config);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (_socket) => {
  console.log("a user connected");

  _socket.on("image3", async (buffer) => {
    const tensor = human.tf.node.decodeImage(buffer);
    const result = await human.detect(tensor);
    console.log(result);

    _socket.emit("data", result);
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
