import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  transports: ["polling", "websocket"], // 👈 IMPORTANT FIX
 withCredentials: false,
});

// import { io } from "socket.io-client";

// export const socket = io("https://dunkacyce-backend.onrender.com", "http://localhost:5000", {
//   transports: ["websocket", "polling"],
//   withCredentials: true,
//   autoConnect: true,
//   reconnection: true,
//   path: "/socket.io",
// });