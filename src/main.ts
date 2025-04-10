import {
  PIDSimulation,
  RoomHeaterPIDSimulation,
} from "./simulations";

const chartCanvas = document.getElementById("ChartArea") as HTMLCanvasElement;
function resize() {
  chartCanvas.width = chartCanvas.clientWidth;
  chartCanvas.height = chartCanvas.clientHeight;
}
window.addEventListener("resize", resize);
resize();


class Program {
  static lastTime: number = performance.now();
  static sim: PIDSimulation;

  static start() {
    this.sim = new RoomHeaterPIDSimulation();
    requestAnimationFrame(Program.loop);
  }
  static loop(now: number) {
    const dt = (now - Program.lastTime) / 1000;
    Program.lastTime = now;

    Program.sim.update(dt);
    Program.sim.draw();

    requestAnimationFrame(Program.loop);
  }
}

Program.start();
