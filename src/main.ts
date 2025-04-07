import {
  AirplaneStabilizerPIDSimulation,
  RoomHeaterPIDSimulation,
} from "./simulations";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Legend
);
const simCanvas = document.getElementById("simCanvas") as HTMLCanvasElement;
const simCtx = simCanvas.getContext("2d")!;
let chart: Chart | null = null;

const TapsGraphCard = () => {
  const chartCanvas = document.getElementById("chartCanvas") as HTMLCanvasElement;

  if (!chartCanvas) {
    console.error("Chart canvas element not found");
    return;
  }

  if (chart) {
    chart.clear();
    chart.destroy();
  }

  chart = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: [] as string[], // time or frame labels
      datasets: [
        {
          label: "Room Temp (°C)",
          data: [] as number[],
          borderColor: "red",
          fill: true,
          tension: 0.1, // smoothing
        },
        {
          label: "Target Temp (°C)",
          data: [] as number[],
          borderColor: "blue",
          borderDash: [5, 5],
          fill: false,
          tension: 0.1,
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
  });
};

TapsGraphCard();

// Resize logic
function resize() {
  const simCanvas = document.getElementById("simCanvas") as HTMLCanvasElement;
  const chartCanvas = document.getElementById("myChart") as HTMLCanvasElement;

  if (simCanvas) {
    simCanvas.width = simCanvas.clientWidth;
    simCanvas.height = simCanvas.clientHeight;
  }

  if (chartCanvas) {
    chartCanvas.width = chartCanvas.clientWidth;
    chartCanvas.height = chartCanvas.clientHeight;
  }

  if (chart) {
    chart.resize();
  }
}

window.addEventListener("resize", resize);

resize();

const sim = new RoomHeaterPIDSimulation({
  target: 25,
  kp: 1.0,
  ki: 0.1,
  kd: 0.05,
});

const inputs = {
  target: document.getElementById("target") as HTMLInputElement,
  kp: document.getElementById("kp") as HTMLInputElement,
  ki: document.getElementById("ki") as HTMLInputElement,
  kd: document.getElementById("kd") as HTMLInputElement,
};

function updateParams() {
  sim.pid_controller.target = parseFloat(inputs.target.value);
  sim.pid_controller.kp = parseFloat(inputs.kp.value);
  sim.pid_controller.ki = parseFloat(inputs.ki.value);
  sim.pid_controller.kd = parseFloat(inputs.kd.value);
}

Object.values(inputs).forEach((el) =>
  el.addEventListener("input", updateParams)
);

let lastTime = performance.now();

function loop(now: number) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  sim.update(dt);
  simCtx?.clearRect(0, 0, simCanvas.width, simCanvas.height);
  sim.draw(simCtx);

  // Add to temperature history
  chart?.data.labels?.push(""); // optional chaining for safety
  chart?.data.datasets[0].data.push(sim.current());
  chart?.data.datasets[1].data.push(sim.pid_controller.target);

  const maxPoints = 200;
  if (chart) {
    chart.data.labels = chart.data.labels?.slice(-maxPoints);
    chart?.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.slice(-maxPoints);
    });
  }

  chart?.update();

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
