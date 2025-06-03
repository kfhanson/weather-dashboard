"use client"

import { useState, useEffect, type MouseEvent, type TouchEvent, useRef } from "react"
import { format } from "date-fns"
import { fetchWeatherData, weatherConditions, getTextColor, type CityWeather } from "../utils/weatherUtils"
import { RefreshCw, Droplets, Wind, AlertCircle, Wifi, WifiOff } from "lucide-react"

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState<CityWeather[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startY, setStartY] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastOffsetRef = useRef(0)

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Load initial weather data
  useEffect(() => {
    loadWeatherData()
  }, [])

  // Auto-refresh weather data every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isDragging && isOnline) {
        loadWeatherData(false) // Silent refresh
      }
    }, 300000) // 5 minutes

    return () => clearInterval(timer)
  }, [isDragging, isOnline])

  const loadWeatherData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true)
      setError(null)

      const data = await fetchWeatherData()
      setWeatherData(data)
    } catch (err) {
      console.error("Failed to load weather data:", err)
      setError("Failed to load weather data")
    } finally {
      if (showLoading) setIsLoading(false)
    }
  }

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true)
    setStartX(e.clientX)
    setStartY(e.clientY)
    lastOffsetRef.current = dragOffset
  }

  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].clientX)
    setStartY(e.touches[0].clientY)
    lastOffsetRef.current = dragOffset
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    updateOffsetBasedOnDrag(deltaX, deltaY)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    const deltaX = e.touches[0].clientX - startX
    const deltaY = e.touches[0].clientY - startY
    updateOffsetBasedOnDrag(deltaX, deltaY)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    resetOffset()
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    resetOffset()
  }

  const updateOffsetBasedOnDrag = (deltaX: number, deltaY: number) => {
    if (!containerRef.current) return

    const containerWidth = containerRef.current.offsetWidth
    const containerHeight = containerRef.current.offsetHeight
    const isMobile = window.innerWidth < 768

    let citySize: number
    let delta: number

    if (isMobile) {
      citySize = containerHeight / weatherData.length
      delta = deltaY
    } else {
      citySize = containerWidth / weatherData.length
      delta = deltaX
    }

    const cityChange = Math.round(delta / citySize)
    const newOffset = lastOffsetRef.current - cityChange * 0.1
    setDragOffset(newOffset)
  }

  const resetOffset = () => {
    setDragOffset(0)
    lastOffsetRef.current = 0
  }

  const refreshWeatherData = async () => {
    if (!isOnline) {
      setError("No internet connection")
      return
    }

    setIsRefreshing(true)
    await loadWeatherData(false)
    setIsRefreshing(false)
  }

  const getCityColors = () => {
    return weatherData.map((city) => {
      const condition = weatherConditions[city.condition]
      return {
        cityId: city.id,
        gradient: condition?.colors.gradient || weatherConditions.sunny.colors.gradient,
      }
    })
  }

  const cityColors = getCityColors()

  if (isLoading) {
    return (
      <div className="h-[100dvh] w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading weather data...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-[100dvh] w-screen overflow-hidden bg-gray-900 relative select-none cursor-grab active:cursor-grabbing touch-none pb-safe"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Weather dashboard"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 flex flex-col md:flex-row w-full h-full">
        {weatherData.map((city) => {
          const cityColor = cityColors.find((cc) => cc.cityId === city.id)
          return (
            <div
              key={`gradient-${city.id}`}
              className="flex-1"
              style={{
                background: cityColor?.gradient || weatherConditions.sunny.colors.gradient,
                flexBasis: `${100 / weatherData.length}%`,
              }}
            />
          )
        })}
      </div>

      {/* Top status bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
        {/* Connection status */}
        <div className="flex items-center space-x-2">
          {isOnline ? <Wifi className="w-4 h-4 text-white/70" /> : <WifiOff className="w-4 h-4 text-red-400" />}
          <p className="text-white/70 text-xs bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
            {weatherData.length > 0 && weatherData[0].lastUpdated instanceof Date
              ? format(weatherData[0].lastUpdated, "HH:mm")
              : format(new Date(), "HH:mm")}
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={refreshWeatherData}
          disabled={isRefreshing || !isOnline}
          className="bg-black/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/30 transition-colors pointer-events-auto disabled:opacity-50"
          aria-label="Refresh weather data"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="absolute top-16 left-4 right-4 z-20">
          <div className="bg-red-500/90 backdrop-blur-sm rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-white" />
            <p className="text-white text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Weather data overlay */}
      <div className="absolute inset-0 flex items-stretch md:items-center justify-center pointer-events-none">
        <div className="flex flex-col md:flex-row w-full h-full md:h-auto">
          {weatherData.map((city) => {
            const textColor = getTextColor(city.condition)
            const WeatherIcon = weatherConditions[city.condition]?.icon || weatherConditions.sunny.icon

            return (
              <div
                key={city.id}
                className="flex-1 flex md:flex-col items-center justify-between px-4 md:px-1 py-2 md:py-2 md:justify-center relative pointer-events-auto"
                style={{
                  flexBasis: `${100 / weatherData.length}%`,
                }}
              >
                <div className="relative z-10 w-full h-full flex items-center md:flex-col md:items-center justify-between md:justify-center">
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-center justify-between w-full">
                    <div className="flex items-center space-x-3">
                      <WeatherIcon className={`w-6 h-6 ${textColor}`} />
                      <div>
                        <div className="group relative cursor-help">
                          <p className={`${textColor} text-sm font-bold`}>{city.abbreviation}</p>
                          <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-10">
                            <div className="bg-black/80 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                              <p className="font-semibold">
                                {city.name}, {city.country}
                              </p>
                              {city.description && <p className="text-xs opacity-75 capitalize">{city.description}</p>}
                            </div>
                          </div>
                        </div>
                        <p className={`${textColor} text-xs opacity-75 capitalize`}>
                          {city.description || weatherConditions[city.condition]?.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`${textColor} text-2xl font-bold`}>{city.temperature}°</p>
                      <p className={`${textColor} text-xs opacity-75`}>Feels {city.feelsLike}°</p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:flex md:flex-col md:items-center md:space-y-1">
                    <WeatherIcon className={`w-8 h-8 ${textColor} mb-1`} />

                    <div className="group relative cursor-help">
                      <p className={`${textColor} text-xs font-bold text-center`}>{city.abbreviation}</p>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block z-10">
                        <div className="bg-black/80 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                          <p className="font-semibold">
                            {city.name}, {city.country}
                          </p>
                          {city.description && <p className="text-xs opacity-75 capitalize">{city.description}</p>}
                        </div>
                      </div>
                    </div>

                    <p className={`${textColor} text-lg font-bold`}>{city.temperature}°</p>

                    <p className={`${textColor} text-[8px] opacity-75 text-center capitalize`}>
                      {city.description || weatherConditions[city.condition]?.name}
                    </p>

                    <p className={`${textColor} text-[8px] opacity-60`}>Feels {city.feelsLike}°</p>
                  </div>

                  {/* Additional weather info on mobile */}
                  <div className="md:hidden flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <Droplets className={`w-3 h-3 ${textColor} opacity-75`} />
                      <span className={`${textColor} text-xs opacity-75`}>{city.humidity}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Wind className={`w-3 h-3 ${textColor} opacity-75`} />
                      <span className={`${textColor} text-xs opacity-75`}>{city.windSpeed}km/h</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom info bar for desktop */}
      <div className="absolute bottom-0 left-0 right-0 hidden md:flex justify-center pb-2">
        {weatherData.map((city) => {
          const textColor = getTextColor(city.condition)
          return (
            <div
              key={`info-${city.id}`}
              className="flex-1 text-center space-y-1"
              style={{ flexBasis: `${100 / weatherData.length}%` }}
            >
              <div className="flex justify-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Droplets className={`w-2 h-2 ${textColor} opacity-60`} />
                  <span className={`${textColor} text-[8px] opacity-60`}>{city.humidity}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Wind className={`w-2 h-2 ${textColor} opacity-60`} />
                  <span className={`${textColor} text-[8px] opacity-60`}>{city.windSpeed}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
