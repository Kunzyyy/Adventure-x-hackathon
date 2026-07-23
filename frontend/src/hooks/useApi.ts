const API_BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export function useApi() {
  return {
    // Resume
    generateResume: (data: {
      name: string;
      education: string;
      skills: string;
      experience: string;
      targetRole?: string;
    }) =>
      request("/resume/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    optimizeResume: (currentResume: string, targetRole?: string) =>
      request("/resume/optimize", {
        method: "POST",
        body: JSON.stringify({ currentResume, targetRole }),
      }),

    polishResume: (
      resumeText: string,
      userInfo?: { name: string; education: string; skills: string; experience: string },
      targetRole?: string
    ) =>
      request<{
        optimizedResume: string;
        changesSummary: string;
        beforeAfter: { before: string; after: string };
        newScore: number;
      }>("/resume/polish", {
        method: "POST",
        body: JSON.stringify({ resumeText, userInfo, targetRole }),
      }),

    // Job
    matchJobs: (profile: {
      skills: string[];
      experience: string;
      education: string;
      preferredIndustry?: string;
      salaryExpectation?: string;
    }) =>
      request("/job/match", {
        method: "POST",
        body: JSON.stringify(profile),
      }),

    // Interview
    startInterview: () =>
      request<{ sessionId: string; message: string }>("/interview/start", {
        method: "POST",
      }),

    interviewChat: (sessionId: string, message: string) =>
      request<{ reply: string; scores: { logic: number; expression: number; structure: number } | null }>(
        "/interview/chat",
        { method: "POST", body: JSON.stringify({ sessionId, message }) }
      ),

    // Auth
    register: (email: string, password: string, name: string) =>
      request<{ token: string; user: { email: string; name: string } }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      }),

    login: (email: string, password: string) =>
      request<{ token: string; user: { email: string; name: string } }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    health: () => request<{ status: string }>("/health"),
  };
}
