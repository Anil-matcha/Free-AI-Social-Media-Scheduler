import { cookies } from "next/headers"; 
import { fetchAgentData, fetchHistoryData } from "@/context/fetchAgentData";
import AgentClientWrapper from "@/components/AgentClientWrapper";

export default async function Page({ params }) {
  const { agent_id, conversation_id } = await params;
  const cookieStore = await cookies();
  const cookieStr = cookieStore.toString();

  // Fetch agent and history in parallel
  const [agentDetails, initialHistory] = await Promise.all([
    fetchAgentData(agent_id, cookieStr, true),
    fetchHistoryData(agent_id, conversation_id, cookieStr)
  ]);

  return (
    <AgentClientWrapper initialAgentDetails={agentDetails} initialHistory={initialHistory} />
  );
}
