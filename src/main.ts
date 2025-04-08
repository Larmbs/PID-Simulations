import { ControlBar, ControlElem, ScrollingChart } from "./ui.ts";
import { ChartConfig } from "./chart.ts";

import { PIDSimulation, RoomHeaterPIDSimulation } from "./simulations";

const simCanvas = document.getElementById("SimArea") as HTMLCanvasElement;
const simCtx = simCanvas.getContext("2d")!;
const chartCanvas = document.getElementById("ChartArea") as HTMLCanvasElement;

class Program {
  static lastTime: number = performance.now();
  static chart: ScrollingChart;
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
    this.chart = new ScrollingChart(200, ChartConfig);

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

    Program.chart.add_label("");
    Program.chart.add_data(0, Program.sim.current());
    Program.chart.add_data(1, Program.sim.pid_controller.target);

    Program.chart.update();

    requestAnimationFrame(Program.loop);
  }
}

Program.start();
