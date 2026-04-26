"use client";
import { useEffect, useState } from "react";
import { Chatbot } from "./Chatbot";

export function ChatbotMount() {
  const [name, setName] = useState<"Alexa" | "Alex">("Alexa");
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(j => {
      setName(j.user?.role === "super_admin" ? "Alex" : "Alexa");
    });
  }, []);
  return <Chatbot assistantName={name} />;
}
