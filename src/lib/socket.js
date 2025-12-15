// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SERVER_URL;

export const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
});
