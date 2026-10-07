export async function fetchAgentData(id, cookieHeader, byName = false) {
  const endpoint = `http://127.0.0.1:8000/api/agents/by-slug/${id}`;
  const res = await fetch(endpoint, {
    cache: 'no-store',
    headers: {
      'Cookie': cookieHeader || '',
    },
  });

  if (!res.ok) return null;

  return await res.json();
}

export async function fetchHistoryData(agentSlug, conversationId, cookieHeader) {
  const endpoint = `http://127.0.0.1:8000/api/agents/by-slug/${agentSlug}/${conversationId}`;
  const res = await fetch(endpoint, {
    cache: 'no-store',
    headers: {
      'Cookie': cookieHeader || '',
    },
  });

  if (!res.ok) return null;
  return await res.json();
}
