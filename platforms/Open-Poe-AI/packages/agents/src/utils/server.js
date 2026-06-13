export const getAgentDetails = async (agentId, options = {}) => {
  const {
    baseUrl = "http://127.0.0.1:8000/agents", // Default relative URL for internal API, or provide full URL
    fetchOptions = {}
  } = options;

  if (!agentId) {
    throw new Error("Agent ID is required");
  }

  const url = `${baseUrl}/${agentId}`;
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      cache: fetchOptions.cache || 'no-store', 
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch agent details: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching agent details:", error);
    throw error;
  }
};
