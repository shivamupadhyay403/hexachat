import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./store/store.js";

const isProd = import.meta.env.VITE_APP_DEV === "production";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    {!isProd ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    )}
  </Provider>
);