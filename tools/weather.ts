/**
 * Weather tool using wttr.in (free, no API key required)
 * API: https://wttr.in/{city}?format=j1
 */

export interface WeatherCurrent {
  temp_C: string;
  temp_F: string;
  humidity: string;
  weatherDesc: string;
  windspeedKmph: string;
  winddir16Point: string;
  feelsLikeC: string;
  visibility: string;
  uvIndex: string;
}

export interface WeatherResult {
  city: string;
  current: WeatherCurrent;
  raw: unknown;
}

export async function getWeather(city: string): Promise<WeatherResult> {
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "agent-tool/1.0" },
  });

  if (!res.ok) {
    throw new Error(`wttr.in returned ${res.status} for city: ${city}`);
  }

  const data = (await res.json()) as {
    current_condition?: Array<Record<string, unknown>>;
  };

  const c = (data.current_condition?.[0] ?? {}) as Record<string, unknown>;

  const weatherDesc =
    (c.weatherDesc as Array<{ value: string }>)?.[0]?.value ?? "";

  const current: WeatherCurrent = {
    temp_C: String(c.temp_C ?? ""),
    temp_F: String(c.temp_F ?? ""),
    humidity: String(c.humidity ?? ""),
    weatherDesc,
    windspeedKmph: String(c.windspeedKmph ?? ""),
    winddir16Point: String(c.winddir16Point ?? ""),
    feelsLikeC: String(c.FeelsLikeC ?? ""),
    visibility: String(c.visibility ?? ""),
    uvIndex: String(c.uvIndex ?? ""),
  };

  return { city, current, raw: data };
}
