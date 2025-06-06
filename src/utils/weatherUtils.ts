import { Cloud, CloudRain, Sun, CloudSnow, Zap, CloudDrizzle, Wind, CloudFogIcon as Fog } from "lucide-react"

export interface WeatherCondition {
  id: string
  name: string
  icon: any
  colors: {
    primary: string
    secondary: string
    gradient: string
  }
}

export interface CityWeather {
  id: string
  name: string
  country: string
  abbreviation: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  pressure: number
  feelsLike: number
  uvIndex: number
  visibility: number
  description?: string
  lastUpdated: Date
}

export const weatherConditions: Record<string, WeatherCondition> = {
  sunny: {
    id: "sunny",
    name: "Sunny",
    icon: Sun,
    colors: {
      primary: "#FFA500",
      secondary: "#FFD700",
      gradient: "linear-gradient(135deg, #FFA500 0%, #FFD700 100%)",
    },
  },
  cloudy: {
    id: "cloudy",
    name: "Cloudy",
    icon: Cloud,
    colors: {
      primary: "#708090",
      secondary: "#B0C4DE",
      gradient: "linear-gradient(135deg, #708090 0%, #B0C4DE 100%)",
    },
  },
  rainy: {
    id: "rainy",
    name: "Rainy",
    icon: CloudRain,
    colors: {
      primary: "#4682B4",
      secondary: "#87CEEB",
      gradient: "linear-gradient(135deg, #4682B4 0%, #87CEEB 100%)",
    },
  },
  snowy: {
    id: "snowy",
    name: "Snowy",
    icon: CloudSnow,
    colors: {
      primary: "#E6E6FA",
      secondary: "#F0F8FF",
      gradient: "linear-gradient(135deg, #E6E6FA 0%, #F0F8FF 100%)",
    },
  },
  stormy: {
    id: "stormy",
    name: "Stormy",
    icon: Zap,
    colors: {
      primary: "#2F4F4F",
      secondary: "#696969",
      gradient: "linear-gradient(135deg, #2F4F4F 0%, #696969 100%)",
    },
  },
  drizzle: {
    id: "drizzle",
    name: "Drizzle",
    icon: CloudDrizzle,
    colors: {
      primary: "#778899",
      secondary: "#B0C4DE",
      gradient: "linear-gradient(135deg, #778899 0%, #B0C4DE 100%)",
    },
  },
  windy: {
    id: "windy",
    name: "Windy",
    icon: Wind,
    colors: {
      primary: "#87CEEB",
      secondary: "#E0F6FF",
      gradient: "linear-gradient(135deg, #87CEEB 0%, #E0F6FF 100%)",
    },
  },
  foggy: {
    id: "foggy",
    name: "Foggy",
    icon: Fog,
    colors: {
      primary: "#A9A9A9",
      secondary: "#D3D3D3",
      gradient: "linear-gradient(135deg, #A9A9A9 0%, #D3D3D3 100%)",
    },
  },
}

export function getTextColor(condition: string): string {
  const weatherCondition = weatherConditions[condition]
  if (!weatherCondition) return "text-black"

  const darkBackgrounds = ["stormy", "cloudy", "rainy"]
  return darkBackgrounds.includes(condition) ? "text-white" : "text-black"
}

export function getTemperatureColor(temp: number): string {
  if (temp <= 0) return "#87CEEB" // Light blue for freezing
  if (temp <= 10) return "#4682B4" // Steel blue for cold
  if (temp <= 20) return "#32CD32" // Lime green for mild
  if (temp <= 30) return "#FFD700" // Gold for warm
  return "#FF6347" // Tomato for hot
}

export async function fetchWeatherData(): Promise<CityWeather[]> {
  try {
    const response = await fetch("/api/weather", {
      next: { revalidate: 300 }, 
    })

    if (!response.ok) {
      throw new Error("Failed to fetch weather data")
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error("Error fetching weather data:", error)
    // Return fallback data if API fails
    return generateFallbackWeatherData()
  }
}

function generateFallbackWeatherData(): CityWeather[] {
  const cities = [
    { name: "New York", country: "USA", abbreviation: "NYC" },
    { name: "London", country: "UK", abbreviation: "LON" },
    { name: "Tokyo", country: "Japan", abbreviation: "TOK" },
    { name: "Sydney", country: "Australia", abbreviation: "SYD" },
    { name: "Paris", country: "France", abbreviation: "PAR" },
    { name: "Dubai", country: "UAE", abbreviation: "DXB" },
    { name: "Singapore", country: "Singapore", abbreviation: "SIN" },
    { name: "Mumbai", country: "India", abbreviation: "BOM" },
    { name: "São Paulo", country: "Brazil", abbreviation: "SAO" },
    { name: "Cairo", country: "Egypt", abbreviation: "CAI" },
    { name: "Moscow", country: "Russia", abbreviation: "MOW" },
    { name: "Bangkok", country: "Thailand", abbreviation: "BKK" },
  ]

  const conditions = Object.keys(weatherConditions)

  return cities.map((city, index) => ({
    id: `${city.name.toLowerCase()}-${index}`,
    name: city.name,
    country: city.country,
    abbreviation: city.abbreviation,
    temperature: Math.round(Math.random() * 40 - 5),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    humidity: Math.round(Math.random() * 100),
    windSpeed: Math.round(Math.random() * 30),
    pressure: Math.round(1000 + Math.random() * 50),
    feelsLike: Math.round(Math.random() * 40 - 5),
    uvIndex: Math.round(Math.random() * 11),
    visibility: Math.round(Math.random() * 20 + 5),
    description: "Weather data unavailable",
    lastUpdated: new Date(),
  }))
}
