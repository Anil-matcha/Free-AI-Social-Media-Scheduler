"use client";

import React from "react";
import { useParams } from "next/navigation";
import OpenSpacesApp from "../../../components/OpenSpacesApp";

export default function ChatConversationRoute() {
  const params = useParams();
  const chatId = params?.chatId;

  return (
    <OpenSpacesApp
      initialRailTab="home"
      initialChatId={chatId}
    />
  );
}
