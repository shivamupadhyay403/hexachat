import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => socket;

export const initSocket = (userId, username) => {
  if (socket?.connected) return socket;
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    socket.emit("register_user", { userId, username });
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};