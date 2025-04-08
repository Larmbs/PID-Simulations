import { ChartConfiguration } from "chart.js";

export const ChartConfig: ChartConfiguration<"line", number[], string> = {
  type: "line",
  data: {
    labels: [], // time or frame labels
    datasets: [
      {
        label: "Room Temp (°C)",
        data: [] as number[],
        borderColor: "red",
        fill: false,
        tension: 0.2, // curve smoothing
        pointRadius: 0, // no dots
        pointHoverRadius: 0, // no hover dots
      },
      {
        label: "Target Temp (°C)",
        data: [] as number[],
        borderColor: "blue",
        borderDash: [5, 5],
        fill: false,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: "Temperature (°C)",
        },
        grid: {
          color: "#eee",
        },
      },
      x: {
        display: false,
      },
    },
    plugins: {
      legend: {
        position: "top",
      },
    },
  },
};
