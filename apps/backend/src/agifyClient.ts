export interface AgifyResponse {
  name: string;
  age: number | null;
  count: number;
}

export async function fetchAge(
  name: string,
  country?: string
): Promise<AgifyResponse> {
  if (!name) throw new Error("Name is required");
  const params = new URLSearchParams({ name });
  if (country) params.append("country_id", country);

  try {
    const response = await fetch(`https://api.agify.io?${params.toString()}`);
    if (!response.ok)
      throw new Error(
        `Failed to fetch from Agify: ${response.status} ${response.statusText}`
      );

    const data = await response.json();
    if (
      !data ||
      !data.name ||
      data.age === undefined ||
      data.count === undefined
    )
      throw new Error("Invalid response from Agify");

    return data;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    throw new Error(
      `Failed to fetch age: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
