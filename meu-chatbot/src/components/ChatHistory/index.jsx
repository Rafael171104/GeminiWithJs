import React from "react";
const ChatHistory = ({ chatHistory }) => {
  return (
    <>
      {chatHistory.map((message, index) => (
        <div
          key={index}
          className={`flex items-start py-2 px-4 rounded-lg ${
            message.type === "user"
              ? "bg-gray-100 text-gray-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {message.type === "user" && (
            <span className="mr-2 font-bold text-gray-600">You:</span>
          )}

          <div>
            {/* Render message as plain text to avoid requiring react-markdown */}
            <div>{message.message}</div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ChatHistory;