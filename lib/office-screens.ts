import * as THREE from "three";

export type StudioScreen = {
  texture: THREE.CanvasTexture;
  update: (seconds: number, chapter: number, still: boolean) => void;
  dispose: () => void;
};

const SOURCE = [
  "import { workflow } from './automation';",
  "import { database } from './infrastructure';",
  "",
  "export async function buildSolution(input) {",
  "  const context = await workflow.discover(input);",
  "  const rules = context.requirements.validate();",
  "",
  "  const project = await database.transaction(async tx => {",
  "    const data = await tx.processes.connect(rules);",
  "    return workflow.create({ data, quality: 'verified' });",
  "  });",
  "",
  "  await project.tests.run();",
  "  await project.preview.publish();",
  "  return { status: 'ready', project };",
  "}",
];

/** Real canvas textures: code → checks → project previews, on the monitor surfaces. */
export function createStudioScreen(kind: "code" | "preview" | "terminal"): StudioScreen {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 640;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  let previous = -1;
  const images = [new Image(), new Image()];
  images[0].src = "/projects/mldds.png";
  images[1].src = "/projects/inteligencia-alc.png";
  images.forEach(image => { image.onload = () => { previous = -1; }; });
  const text = (value: string, x: number, y: number, color = "#b6c2d4", size = 20) => {
    ctx.fillStyle = color; ctx.font = `${size}px ui-monospace, SFMono-Regular, Consolas, monospace`; ctx.fillText(value, x, y);
  };
  const rectangle = (x: number, y: number, w: number, h: number, color: string, radius = 8) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
  };
  function dashboard(seconds: number, chapter: number) {
    rectangle(26, 87, 172, 520, "#121b28");
    text("ARCHI", 47, 130, "#e6edf7", 29); text("CENTRAL ALC", 48, 159, "#7f97b5", 12);
    ["Visão geral", "Operação", "Processos", "Integrações", "Qualidade"].forEach((item, index) => {
      if (index === 0) rectangle(38, 185, 148, 42, "#2a3d53");
      text(item, 50, 213 + index * 61, index === 0 ? "#eef4ff" : "#8b9eb5", 16);
    });
    text("Operação conectada", 228, 126, "#e5edf7", 30);
    text("PREVIEW CONCEITUAL / PORTFÓLIO", 230, 155, "#8193a9", 13);
    for (let i = 0; i < 3; i++) {
      rectangle(226 + i * 254, 184, 232, 108, "#172332");
      text(["Processos", "Integrações", "Qualidade"][i], 243 + i * 254, 215, "#9bb0c9", 16);
      text(["Conectados", "Ativas", "Validada"][i], 243 + i * 254, 260, "#e0eaf8", 28);
    }
    rectangle(226, 316, 740, 204, "#152130");
    text("Fluxo de desenvolvimento", 249, 348, "#a7bdd7", 17);
    ctx.strokeStyle = "#81a5c9"; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i < 50; i++) {
      const x = 249 + i * 14, y = 473 - i * 1.8 - Math.sin(i * .35 + seconds * .3) * 18;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    rectangle(226, 544, 740, 58, "#172332");
    text(["REQUISITOS → SISTEMA → VALIDAÇÃO", "CÓDIGO → TESTES → PREVIEW", "PROCESSOS → DADOS → SOLUÇÕES"][chapter % 3], 245, 580, "#b6c9df", 18);
  }
  const update = (seconds: number, chapter: number, still: boolean) => {
    const step = still ? 70 : Math.floor(seconds * 6);
    if (step === previous) return;
    previous = step;
    const phase = still ? 14 : (seconds + (kind === "preview" ? 9 : kind === "terminal" ? 4 : 0)) % 24;
    const projectIndex = Math.floor(seconds / 24 + chapter) % 3;
    ctx.fillStyle = "#0b111c"; ctx.fillRect(0, 0, 1024, 640);
    rectangle(0, 0, 1024, 60, "#19222f", 0);
    ["#9daec5", "#65778d", "#45556a"].forEach((color, index) => {
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(26 + index * 24, 29, 6, 0, Math.PI * 2); ctx.fill();
    });
    text(kind === "terminal" ? "MF / WORKFLOW" : "MF STUDIO / WORKSPACE", 135, 36, "#c8d7e9", 18);
    text("● LIVE", 907, 36, "#a2c7ba", 16);
    if (phase < 9) {
      rectangle(0, 61, 50, 579, "#111a27", 0);
      rectangle(63, 71, 310, 35, "#213044"); text("solution.ts", 81, 96, "#d6e2f2", 16);
      const count = Math.min(SOURCE.length, Math.floor(phase / 9 * SOURCE.length) + 3);
      SOURCE.slice(0, count).forEach((line, index) => {
        text(String(index + 1).padStart(2, "0"), 65, 145 + index * 25, "#52677f", 15);
        const last = index === count - 1 && phase < 7;
        const content = last ? line.slice(0, Math.floor((phase * 11 % 1) * line.length)) : line;
        text(content, 110, 145 + index * 25, line.includes("await") ? "#a0c8dd" : line.startsWith("import") || line.startsWith("export") ? "#b9acd6" : "#a6b6cb", 17);
      });
      rectangle(0, 609, 1024, 31, "#263a50", 0); text("main  •  TypeScript                                  MF / development", 20, 630, "#cbd8e8", 14);
    } else if (phase < 12) {
      text("CONSTRUINDO A SOLUÇÃO", 58, 139, "#e3ebf5", 27);
      const lines = ["✓ Requisitos estruturados", "✓ Integrações conectadas", "✓ Verificações concluídas", "✓ Preview disponível"];
      lines.forEach((line, index) => { if (phase - 9 > index * .6) text(line, 60, 210 + index * 65, "#a7cdbf", 25); });
      rectangle(60, 527, 890, 8, "#243449"); rectangle(60, 527, Math.min(890, (phase - 9) / 3 * 890), 8, "#aac3df");
      text("PROCESSOS → CÓDIGO → EXPERIÊNCIA", 60, 584, "#7c96b3", 17);
    } else if (kind === "terminal") {
      text("MF / PROJECT PIPELINE", 55, 136, "#d9e6f5", 25);
      ["$ workflow requirements.validate", "  ✓ contexto e regras definidos", "$ workflow build --production", "  ✓ interfaces e integrações", "$ workflow quality.check", "  ✓ revisão e validação", "$ workflow preview.open", "  → solução pronta para explorar"].forEach((line, index) => text(line, 55, 204 + index * 43, index % 2 === 0 ? "#a3bbda" : "#a3c6b7", 22));
    } else if (projectIndex === 0) dashboard(seconds, chapter);
    else {
      const image = images[projectIndex - 1];
      text(projectIndex === 1 ? "MLDDS / ROTEIRIZAÇÃO" : "ALC / INTELIGÊNCIA OPERACIONAL", 35, 101, "#dce7f5", 23);
      if (image.complete && image.naturalWidth) {
        const ratio = Math.min(954 / image.naturalWidth, 475 / image.naturalHeight);
        const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
        ctx.drawImage(image, (1024 - w) / 2, 121 + (475 - h) / 2, w, h);
      } else dashboard(seconds, chapter);
      text("INTERFACE REAL / PROJETO DO PORTFÓLIO", 35, 620, "#7f95b0", 15);
    }
    texture.needsUpdate = true;
  };
  update(0, 0, false);
  return { texture, update, dispose: () => { images.forEach(image => { image.onload = null; }); texture.dispose(); } };
}
