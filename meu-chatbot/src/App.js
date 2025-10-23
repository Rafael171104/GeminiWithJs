import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Style components using Tailwind CSS
import "./App.css";
import ChatHistory from "./components/ChatHistory";
import Loading from "./components/Loading";

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const modelRef = useRef(null);

  // Load chat history from sessionStorage so it's kept while the tab is open
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("chatHistory");
      if (saved) setChatHistory(JSON.parse(saved));
    } catch (e) {
      console.warn("Could not load chat history from sessionStorage", e);
    }
  }, []);

  // Persist chat history to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem("chatHistory", JSON.stringify(chatHistory));
    } catch (e) {
      console.warn("Could not save chat history to sessionStorage", e);
    }
  }, [chatHistory]);

  // initialize your Gemini API client once
  useEffect(() => {
    try {
      // TODO: move API key to environment variables for security
      const genAI = new GoogleGenerativeAI(
        "AIzaSyCzqFYS0LxWhOKeg3uz9BrUq4D4FlYMWlE"
      );
  modelRef.current = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log("GoogleGenerativeAI initialized", modelRef.current);
    } catch (e) {
      console.warn("Could not initialize GoogleGenerativeAI client", e);
    }
  }, []);

  // Function to handle user input
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  // Function to send user message to Gemini
  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    setIsLoading(true);
    try {
      // add user's message optimistically
      setChatHistory((prev) => [...prev, { type: "user", message: userInput }]);

      // call Gemini Api to get a response
      const model = modelRef.current;
      console.log("Sending to model", { modelAvailable: !!model, model });
      let botText = "";
      if (model && typeof model.generateContent === "function") {
        let result;
        try {
          result = await model.generateContent(userInput);
          console.log("Raw model result:", result);
        } catch (callErr) {
          console.error("Error calling model.generateContent", callErr);
          // show an error to user in chat
          setChatHistory((prev) => [...prev, { type: "bot", message: `(error calling model): ${callErr.message || callErr}` }]);
          return;
        }

        // Try to extract response text from a few possible shapes
        if (!result) {
          botText = "(no response)";
        } else if (typeof result === "string") {
          botText = result;
        } else if (result.outputText) {
          botText = result.outputText;
        } else if (result.response) {
          const resp = result.response;
          if (typeof resp === "string") botText = resp;
          else if (resp.text) {
            botText = typeof resp.text === "function" ? await resp.text() : resp.text;
          } else if (resp.outputText) botText = resp.outputText;
        } else if (result.candidates && result.candidates[0] && result.candidates[0].content) {
          botText = result.candidates[0].content;
        } else {
          botText = JSON.stringify(result).slice(0, 1000);
        }
      } else {
        botText = "(model not initialized - check API key and network)";
      }

      // append bot response
      setChatHistory((prev) => [...prev, { type: "bot", message: botText }]);
    } catch (err) {
      console.error("Error sending message", err);
      setChatHistory((prev) => [...prev, { type: "bot", message: "(error sending message)" }]);
    } finally {
      setUserInput("");
      setIsLoading(false);
    }
  };

  // Function to clear the chat history
  const clearChat = () => {
    setChatHistory([]);
    try {
      sessionStorage.removeItem("chatHistory");
    } catch (e) {
      /* ignore */
    }
  };

  // Ensure sessionStorage is cleared when the tab/window is closed
  useEffect(() => {
    const onUnload = () => {
      try {
        sessionStorage.removeItem("chatHistory");
      } catch (e) {
        /* ignore */
      }
    };
    window.addEventListener("unload", onUnload);
    return () => window.removeEventListener("unload", onUnload);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-4">Chatbot</h1>

      <div className="chat-container rounded-lg shadow-md p-4">
        <ChatHistory chatHistory={chatHistory} />
        <Loading isLoading={isLoading} />
      </div>

      <div className="flex mt-4">
        <input
          type="text"
          className="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={userInput}
          onChange={handleUserInput}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!isLoading) sendMessage();
            }
          }}
        />
        <button
          className="px-4 py-2 ml-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
          onClick={sendMessage}
          disabled={isLoading}
        >
          Send
        </button>
      </div>
      <button
        className="mt-4 block px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500 focus:outline-none"
        onClick={clearChat}
      >
        Clear Chat
      </button>
    </div>
  );
};

export default App;