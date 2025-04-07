import {
  AirplaneStabilizerPIDSimulation,
  PIDSimulation,
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
const chartCanvas = document.getElementById("chartCanvas") as HTMLCanvasElement;

class Program {
  static lastTime: number = performance.now();
  static chart: Chart;
  static sim: PIDSimulation;

  static start() {
    // Create simulation
    const sim = new AirplaneStabilizerPIDSimulation({
      target: 50,
      kp: 5,
      ki: 5,
      kd: -0.6,
    });

    function resize() {
      simCanvas.width = simCanvas.clientWidth;
      simCanvas.height = simCanvas.clientHeight;
      chartCanvas.width = chartCanvas.clientWidth;
      chartCanvas.height = chartCanvas.clientHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    if (Chart.getChart("chartCanvas")) Chart.getChart("chartCanvas")?.destroy();
    Program.chart = new Chart(chartCanvas, {
      type: "line",
      data: {
        labels: [] as string[], // time or frame labels
        datasets: [
          {
            label: "Room Temp (°C)",
            data: [] as number[],
            borderColor: "red",
            fill: false,
            tension: 0.2, // smoothing
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

    requestAnimationFrame(Program.loop);
  }
  static loop(now: number) {
    const dt = (now - Program.lastTime) / 1000;
    Program.lastTime = now;
    Program.sim.update(dt);
    simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
    Program.sim.draw(simCtx);

    // Update chart
    Program.chart.data.labels?.push(""); // label (could be time later)
    Program.chart.data.datasets[0].data.push(Program.sim.current());
    Program.chart.data.datasets[1].data.push(Program.sim.pid_controller.target);

    // Keep dataset short
    const maxPoints = 200;
    Program.chart.data.labels = Program.chart.data.labels?.slice(-maxPoints);
    Program.chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.slice(-maxPoints);
    });

    Program.chart.update();

    requestAnimationFrame(Program.loop);
  }
}

Program.start();
