import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/socket/socketClient";
import { appendMessage, replaceTempMessage } from "@/store/slices/chatSlice";
import { setOnlineUsers } from "@/store/slices/onlineUsersSlice"; // see below
import useUser from "./useUser";

export function useSocket() {
  const dispatch = useDispatch();
  const { getUserId } = useUser();
  const myId = getUserId();
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onPrivateMessage = (msg) => {
      dispatch(appendMessage({ ...msg, myId }));
    };

    const onMessageDelivered = (msg) => {
      dispatch(replaceTempMessage(msg));
    };

    const onOnlineUsers = (users) => {
      dispatch(setOnlineUsers(users));
    };

    socket.on("private_message", onPrivateMessage);
    socket.on("message_delivered", onMessageDelivered);
    socket.on("online_users", onOnlineUsers);

    return () => {
      socket.off("private_message", onPrivateMessage);
      socket.off("message_delivered", onMessageDelivered);
      socket.off("online_users", onOnlineUsers);
    };
  }, [dispatch, myId]);
}
