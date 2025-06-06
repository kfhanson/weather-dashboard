import { NextResponse } from "next/server"

const OPENWEATHER_API_KEY = "887d13fb7c28d8989b83fe64a0538c60"
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

interface OpenWeatherResponse {
  name: string
  sys: {
    country: string
  }
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    main: string
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  visibility: number
  dt: number
}

const cities = [
  { name: "New York", country: "US", abbreviation: "NYC", lat: 40.7128, lon: -74.006 },
  { name: "London", country: "GB", abbreviation: "LON", lat: 51.5074, lon: -0.1278 },
  { name: "Tokyo", country: "JP", abbreviation: "TOK", lat: 35.6762, lon: 139.6503 },
  { name: "Sydney", country: "AU", abbreviation: "SYD", lat: -33.8688, lon: 151.2093 },
  { name: "Paris", country: "FR", abbreviation: "PAR", lat: 48.8566, lon: 2.3522 },
  { name: "Dubai", country: "AE", abbreviation: "DXB", lat: 25.2048, lon: 55.2708 },
  { name: "Singapore", country: "SG", abbreviation: "SIN", lat: 1.3521, lon: 103.8198 },
  { name: "Mumbai", country: "IN", abbreviation: "BOM", lat: 19.076, lon: 72.8777 },
  { name: "São Paulo", country: "BR", abbreviation: "SAO", lat: -23.5505, lon: -46.6333 },
  { name: "Cairo", country: "EG", abbreviation: "CAI", lat: 30.0444, lon: 31.2357 },
  { name: "Moscow", country: "RU", abbreviation: "MOW", lat: 55.7558, lon: 37.6176 },
  { name: "Bangkok", country: "TH", abbreviation: "BKK", lat: 13.7563, lon: 100.5018 },
]

function mapWeatherCondition(weatherMain: string, description: string): string {
  const main = weatherMain.toLowerCase()
  const desc = description.toLowerCase()

  if (main === "clear") return "sunny"
  if (main === "clouds") {
    if (desc.includes("few") || desc.includes("scattered")) return "cloudy"
    return "cloudy"
  }
  if (main === "rain") {
    if (desc.includes("drizzle") || desc.includes("light")) return "drizzle"
    return "rainy"
  }
  if (main === "drizzle") return "drizzle"
  if (main === "thunderstorm") return "stormy"
  if (main === "snow") return "snowy"
  if (main === "mist" || main === "fog" || main === "haze") return "foggy"
  if (main === "dust" || main === "sand" || main === "ash") return "windy"
  if (main === "squall" || main === "tornado") return "windy"

  return "sunny"
}

export async function GET() {
  try {
    const weatherPromises = cities.map(async (city) => {
      try {
        const response = await fetch(
          `${OPENWEATHER_BASE_URL}/weather?lat=${city.lat}&lon=${city.lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
          { next: { revalidate: 300 } },
        )

        if (!response.ok) {
          throw new Error(`Weather API error for ${city.name}: ${response.status}`)
        }

        const data: OpenWeatherResponse = await response.json()

        return {
          id: `${city.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: city.name,
          country: city.country,
          abbreviation: city.abbreviation,
          temperature: Math.round(data.main.temp),
          condition: mapWeatherCondition(data.weather[0].main, data.weather[0].description),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind.speed * 3.6),
          pressure: data.main.pressure,
          feelsLike: Math.round(data.main.feels_like),
          uvIndex: 0, 
          visibility: Math.round(data.visibility / 1000), 
          description: data.weather[0].description,
          lastUpdated: new Date(data.dt * 1000),
        }
      } catch (error) {
        console.error(`Error fetching weather for ${city.name}:`, error)
        return {
          id: `${city.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: city.name,
          country: city.country,
          abbreviation: city.abbreviation,
          temperature: 20,
          condition: "sunny",
          humidity: 50,
          windSpeed: 10,
          pressure: 1013,
          feelsLike: 20,
          uvIndex: 5,
          visibility: 10,
          description: "Clear sky",
          lastUpdated: new Date(),
        }
      }
    })

    const weatherData = await Promise.all(weatherPromises)

    return NextResponse.json(weatherData)
  } catch (error) {
    console.error("Error in weather API route:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
