"use client"

import dynamic from "next/dynamic"

const ChatbotWrapper = dynamic(
  () => import("@/components/shared/ChatbotWrapper"),
  { ssr: false }
)

interface Props {
  userRole: string | null;
}

export default function ChatbotDynamic({ userRole }: Props) {
  return <ChatbotWrapper userRole={userRole} />
}
