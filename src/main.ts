import { PIDVars } from "./pid_controller";
import { ControlBar, ControlElem } from "./ui.ts";

import {
  AirplaneStabilizerPIDSimulation,
  PIDSimulation,
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

const simCanvas = document.getElementById("SimArea") as HTMLCanvasElement;
const simCtx = simCanvas.getContext("2d")!;
const chartCanvas = document.getElementById("ChartArea") as HTMLCanvasElement;

class Program {
  static lastTime: number = performance.now();
  static chart: Chart;
  static sim: PIDSimulation;
  static control_bar: ControlBar = new ControlBar();

  static start() {
    const default_target = 25;
    const default_args = {
      kp: 5,
      ki: 5,
      kd: -1,
    };
    this.sim = new RoomHeaterPIDSimulation(25, default_args);

    Program.control_bar.add_control(
      "Target",
      new ControlElem(0, 50, 0.5, default_target)
    );
    Program.control_bar.add_control(
      "KP",
      new ControlElem(-5, 5, 0.1, default_args.kp)
    );
    Program.control_bar.add_control(
      "KI",
      new ControlElem(-5, 5, 0.1, default_args.ki)
    );
    Program.control_bar.add_control(
      "KD",
      new ControlElem(-5, 5, 0.1, default_args.kd)
    );
    Program.control_bar.update_html();

    function resize() {
      simCanvas.width = simCanvas.clientWidth;
      simCanvas.height = simCanvas.clientHeight;
      chartCanvas.width = chartCanvas.clientWidth;
      chartCanvas.height = chartCanvas.clientHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    if (Chart.getChart("ChartArea")) Chart.getChart("ChartArea")?.destroy();
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
    });

    requestAnimationFrame(Program.loop);
  }
  static loop(now: number) {
    const dt = (now - Program.lastTime) / 1000;
    Program.lastTime = now;

    Program.sim.pid_controller.set(
      Program.control_bar.get_control("Target")?.get_value() || 0,
      {
        kp: Program.control_bar.get_control("KP")?.get_value() || 0,
        ki: Program.control_bar.get_control("KI")?.get_value() || 0,
        kd: Program.control_bar.get_control("KD")?.get_value() || 0,
      }
    );

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
