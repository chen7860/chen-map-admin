import { http } from "@/utils/http";

export type WeatherResult = {
  bbox: [number, number, number, number];
  matrix: any[];
  legend?: Record<string, any>;
};

export const getWeather = () => {
  return http.get<WeatherResult, unknown>("/weather");
};
