import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getSocket } from "@/socket/socketClient";
import { appendMessage, replaceTempMessage, setTyping } from "@/store/slices/chatSlice";
import { setOnlineUsers } from "@/store/slices/onlineUsersSlice";

export function useSocket(myId) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!myId) return;
    const socket = getSocket();
    if (!socket) return;

    const onPrivateMessage = (msg) => {
      dispatch(appendMessage({ ...msg, myId: String(myId) }));
    };

    const onMessageDelivered = (msg) => {
      dispatch(replaceTempMessage({ ...msg, myId: String(myId) }));
    };

    const onOnlineUsers = (users) => {
      dispatch(setOnlineUsers(users));
    };

    const onTyping = ({ senderId, isTyping }) => {
      dispatch(setTyping({ userId: String(senderId), isTyping }));
    };

    socket.on("private_message",   onPrivateMessage);
    socket.on("message_delivered", onMessageDelivered);
    socket.on("online_users",      onOnlineUsers);
    socket.on("typing",            onTyping);

    return () => {
      socket.off("private_message",   onPrivateMessage);
      socket.off("message_delivered", onMessageDelivered);
      socket.off("online_users",      onOnlineUsers);
      socket.off("typing",            onTyping);
    };
  }, [dispatch, myId]);
}