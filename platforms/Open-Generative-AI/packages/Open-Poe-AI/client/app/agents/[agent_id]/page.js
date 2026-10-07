import { cookies } from "next/headers";
import { fetchAgentData } from "@/context/fetchAgentData";
import AgentClientWrapper from "@/components/AgentClientWrapper";

export default async function Page({ params }) {
  const { agent_id } = await params;
  const cookieStore = await cookies();

  // Fetch agent by slug
  const agentDetails = await fetchAgentData(agent_id, cookieStore.toString(), true);
  return (
    <AgentClientWrapper initialAgentDetails={agentDetails} />
  );
}
