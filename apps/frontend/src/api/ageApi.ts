interface AgeResponse {
  name: string;
  age: number | null;
  count: number;
  country_id?: string;
}

interface AgeError {
  error: string;
}

const API_BASE_URL = "http://localhost:3001";

export async function fetchAgeEstimation(
  name: string,
  countryId?: string
): Promise<AgeResponse> {
  const params = new URLSearchParams({ name });
  if (countryId) {
    params.append("country_id", countryId);
  }
  const response = await fetch(`${API_BASE_URL}/age?${params}`);
  if (!response.ok) {
    const errorData: AgeError = await response.json();
    throw new Error(errorData.error || "Failed to fetch age");
  }
  return response.json();
}
