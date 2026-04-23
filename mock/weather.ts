import { defineFakeRoute } from "vite-plugin-fake-server/client";
import weatherData from "../public/weather.json";

export default defineFakeRoute([
  {
    url: "/weather",
    method: "get",
    response: () => weatherData
  }
]);
