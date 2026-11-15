(() => {
  "use strict";

  const stations = [
    {
      title: "装载两个特征",
      intro: "当前样本有两个特征。点击“下一站”，看它们怎样变成隐藏层的输入信号。",
      formula: "x = [0.80, 0.60]",
      detail: "专注度和截止时间紧迫度组成二维输入向量。此时数据只是数值，还没有经过任何权重。",
      status: "INPUT",
    },
    {
      title: "乘以第一层权重",
      intro: "三个隐藏神经元同时读取两个输入，但每个神经元对特征的“在意程度”不同。",
      formula: "h₁ = .80 × .60 + .60 × (−1.40)\nh₂ = .80 × .40 + .60 × .80\nh₃ = .80 × .90 + .60 × 1.10",
      detail: "权重决定每条连接的贡献。正权重放大信号，负权重则把信号推向相反方向。",
      status: "WEIGHTED",
    },
    {
      title: "加入隐藏层偏置",
      intro: "偏置给每个隐藏神经元一个独立起点。即使输入相同，它们也会得到不同的中间得分。",
      formula: "z₁ = 0.48 − 0.84 − 0.10 = −0.46\nz₂ = 0.32 + 0.48 − 0.20 = 0.60\nz₃ = 0.72 + 0.66 − 0.30 = 1.08",
      detail: "这一步得到的是线性预激活值 z。它仍然可以是负数，还不能直接代表“激活强度”。",
      status: "BIAS",
    },
    {
      title: "用 ReLU 过滤信号",
      intro: "ReLU 只保留正值：负值归零，正值不变。h₁ 的信号在这里被关闭。",
      formula: "a = max(0, z)\n→ a = [0.00, 0.60, 1.08]",
      detail: "ReLU 为网络加入非线性。若没有激活函数，多层线性变换仍然可以合并成一层。",
      status: "ACTIVATE",
    },
    {
      title: "送向输出层",
      intro: "三个激活值分别乘上第二层权重，再准备汇总。每条连接都有自己的贡献。",
      formula: "0 × .55 = 0.000\n.60 × .65 = 0.390\n1.08 × .85 = 0.918",
      detail: "被 ReLU 关闭的 h₁ 贡献为 0；h₃ 的权重较高，因此它在最终得分中的影响最大。",
      status: "OUTPUT LINK",
    },
    {
      title: "汇总并加入最后一层偏置",
      intro: "三个贡献相加，再减去输出层偏置 0.53，得到这次前向传播的 Logit。",
      formula: "z² = 0.000 + 0.390 + 0.918 − 0.530\nz² = 0.778",
      detail: "0.778 是一个未压缩的原始得分。它可正可负、也可以大于 1，因此还不是概率。",
      status: "LOGIT",
    },
    {
      title: "用 Sigmoid 变成概率",
      intro: "Sigmoid 将 Logit 压缩到 0 和 1 之间。这里的输出可以解释为二分类概率。",
      formula: "ŷ = 1 ÷ (1 + e^(−0.778))\nŷ ≈ 0.685 → 68.5%",
      detail: "模型认为“今晚能完成任务”的概率约为 68.5%。这个结果来自当前参数，并不等于事实保证。",
      status: "COMPLETE",
    },
  ];

  const nodes = {
    inputs: [
      { id: "x1", x: 0.13, y: 0.36, label: "专注度", value: "0.80", color: "#d8ff67" },
      { id: "x2", x: 0.13, y: 0.66, label: "紧迫度", value: "0.60", color: "#7bdff2" },
    ],
    hidden: [
      { id: "h1", x: 0.49, y: 0.24, label: "h₁", value: "0.00", color: "#ff7a59" },
      { id: "h2", x: 0.49, y: 0.51, label: "h₂", value: "0.60", color: "#d8ff67" },
      { id: "h3", x: 0.49, y: 0.78, label: "h₃", value: "1.08", color: "#7bdff2" },
    ],
    output: { id: "out", x: 0.84, y: 0.51, label: "ŷ", value: "68.5%", color: "#d8ff67" },
  };

  const weights = {
    first: [
      [0.6, -1.4],
      [0.4, 0.8],
      [0.9, 1.1],
    ],
    second: [0.55, 0.65, 0.85],
  };

  const shipStops = [
    { x: 0.08, y: 0.78 },
    { x: 0.25, y: 0.32 },
    { x: 0.36, y: 0.72 },
    { x: 0.48, y: 0.51 },
    { x: 0.61, y: 0.31 },
    { x: 0.72, y: 0.72 },
    { x: 0.91, y: 0.51 },
  ];

  const canvas = document.querySelector("#networkCanvas");
  const ctx = canvas.getContext("2d");
  const experience = document.querySelector("#learningExperience");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const els = {
    heroLaunch: document.querySelector("#heroLaunch"),
    next: document.querySelector("#nextBtn"),
    prev: document.querySelector("#prevBtn"),
    reset: document.querySelector("#resetBtn"),
    auto: document.querySelector("#autoBtn"),
    stationIndex: document.querySelector("#stationIndex"),
    stationStatus: document.querySelector("#stationStatus"),
    stationTitle: document.querySelector("#stationTitle"),
    stationIntro: document.querySelector("#stationIntro"),
    stationFormula: document.querySelector("#stationFormula"),
    stationDetail: document.querySelector("#stationDetail"),
    sceneStep: document.querySelector("#sceneStep"),
    sceneOutput: document.querySelector("#sceneOutput"),
    logitValue: document.querySelector("#logitValue"),
    probabilityValue: document.querySelector("#probabilityValue"),
    stationTrack: document.querySelector("#stationTrack"),
    cards: [...document.querySelectorAll(".flow-card")],
  };

  let step = -1;
  let autoTimer = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let lastTime = performance.now();
  let targetShip = { ...shipStops[0] };
  let currentShip = { ...shipStops[0] };
  let targetIndex = 0;

  function createTrack() {
    stations.forEach((station, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.title = station.title;
      button.setAttribute("aria-label", `跳到第 ${index + 1} 站：${station.title}`);
      button.addEventListener("click", () => goTo(index));
      els.stationTrack.appendChild(button);
    });
  }

  function stopAuto() {
    window.clearInterval(autoTimer);
    autoTimer = 0;
    els.auto.setAttribute("aria-pressed", "false");
    els.auto.textContent = "自动巡航";
  }

  function startAuto() {
    if (autoTimer) return;
    if (step >= stations.length - 1) goTo(0);
    els.auto.setAttribute("aria-pressed", "true");
    els.auto.textContent = "暂停巡航";
    autoTimer = window.setInterval(() => {
      if (step >= stations.length - 1) {
        stopAuto();
        return;
      }
      goTo(step + 1);
    }, 1900);
  }

  function render() {
    const station = stations[step];
    const shownStep = Math.max(0, step + 1);
    const complete = step === stations.length - 1;

    els.sceneStep.textContent = `${String(shownStep).padStart(2, "0")} / 07`;
    els.sceneOutput.textContent =
      step < 0 ? "待机" : complete ? "68.5%" : `第 ${step + 1} 站`;
    els.stationIndex.textContent = `STATION ${String(shownStep).padStart(2, "0")}`;
    els.stationStatus.textContent = station ? station.status : "READY";
    els.stationTitle.textContent = station ? station.title : "等待装载输入";
    els.stationIntro.textContent = station
      ? station.intro
      : "当前样本有两个特征。点击“下一站”，看它们怎样变成隐藏层的输入信号。";
    els.stationFormula.textContent = station ? station.formula : "x = [0.80, 0.60]";
    els.stationDetail.textContent = station
      ? station.detail
      : "把特征写成向量，是前向传播的起点。权重负责回答：这个特征对下一步有多重要？";

    els.logitValue.textContent = step >= 5 ? "0.778" : "—";
    els.probabilityValue.textContent = step >= 6 ? "68.5%" : "—";
    els.next.textContent = complete ? "重新演示 ↺" : step < 0 ? "开始演示 →" : "下一站 →";
    els.prev.disabled = step <= 0;
    els.reset.disabled = step < 0;

    [...els.stationTrack.children].forEach((button, index) => {
      button.classList.toggle("is-done", index < step);
      button.classList.toggle("is-current", index === step);
      button.setAttribute("aria-current", index === step ? "step" : "false");
    });

    els.cards.forEach((card) => {
      card.classList.toggle("is-active", Number(card.dataset.step) === step);
    });

    targetIndex = step < 0 ? 0 : step;
    targetShip = { ...shipStops[targetIndex] };
  }

  function goTo(index) {
    step = Math.max(-1, Math.min(stations.length - 1, index));
    render();
    if (reducedMotion.matches) {
      currentShip = { ...targetShip };
    }
  }

  function nextStep() {
    stopAuto();
    if (step >= stations.length - 1) {
      goTo(0);
      return;
    }
    goTo(step + 1);
  }

  function previousStep() {
    stopAuto();
    if (step > 0) goTo(step - 1);
  }

  function resetExperience() {
    stopAuto();
    goTo(-1);
  }

  function focusCockpit(index) {
    goTo(index);
    stopAuto();
    experience.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    window.setTimeout(() => canvas.focus({ preventScroll: true }), 350);
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function point(node) {
    return { x: node.x * width, y: node.y * height };
  }

  function line(a, b, color, lineWidth = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }

  function pulse(a, b, phase, color) {
    const x = a.x + (b.x - a.x) * phase;
    const y = a.y + (b.y - a.y) * phase;
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBackground(time) {
    const gradient = ctx.createRadialGradient(
      width * 0.55,
      height * 0.48,
      10,
      width * 0.55,
      height * 0.48,
      Math.max(width, height) * 0.7,
    );
    gradient.addColorStop(0, "rgba(15, 38, 40, 0.95)");
    gradient.addColorStop(0.58, "rgba(7, 20, 22, 0.96)");
    gradient.addColorStop(1, "rgba(4, 11, 12, 1)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.strokeStyle = "rgba(180, 224, 219, 0.055)";
    ctx.lineWidth = 1;
    const horizon = height * 0.42;
    for (let i = 0; i < 16; i += 1) {
      const y = horizon + Math.pow(i / 15, 1.7) * height * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i += 1) {
      ctx.beginPath();
      ctx.moveTo(width * 0.5 + i * 14, horizon);
      ctx.lineTo(width * 0.5 + i * width * 0.09, height);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(216, 255, 103, 0.2)";
    for (let i = 0; i < 38; i += 1) {
      const seedX = (i * 137.5) % 100;
      const seedY = (i * 79.3) % 100;
      const twinkle = reducedMotion.matches ? 1 : 0.45 + Math.sin(time / 900 + i) * 0.25;
      ctx.globalAlpha = twinkle * 0.22;
      ctx.fillRect((seedX / 100) * width, (seedY / 100) * height, i % 5 === 0 ? 1.5 : 1, i % 5 === 0 ? 1.5 : 1);
    }
    ctx.restore();
  }

  function drawNetwork(time) {
    const inputPoints = nodes.inputs.map(point);
    const hiddenPoints = nodes.hidden.map(point);
    const outputPoint = point(nodes.output);

    weights.first.forEach((row, hiddenIndex) => {
      row.forEach((weight, inputIndex) => {
        const alpha = 0.08 + Math.min(Math.abs(weight) / 1.5, 1) * 0.24;
        const color = weight < 0 ? "rgba(255, 122, 89, 0.75)" : "rgba(123, 223, 242, 0.72)";
        line(inputPoints[inputIndex], hiddenPoints[hiddenIndex], color, 1, alpha);
        if (!reducedMotion.matches && step >= 1 && step <= 3) {
          const phase = ((time / 1450 + hiddenIndex * 0.17 + inputIndex * 0.31) % 1);
          pulse(inputPoints[inputIndex], hiddenPoints[hiddenIndex], phase, weight < 0 ? "#ff7a59" : "#7bdff2");
        }
      });
    });

    weights.second.forEach((weight, hiddenIndex) => {
      const alpha = 0.1 + Math.min(Math.abs(weight), 1) * 0.28;
      line(hiddenPoints[hiddenIndex], outputPoint, "rgba(216, 255, 103, 0.7)", 1.2, alpha);
      if (!reducedMotion.matches && step >= 4) {
        const phase = ((time / 1300 + hiddenIndex * 0.22) % 1);
        pulse(hiddenPoints[hiddenIndex], outputPoint, phase, hiddenIndex === 0 ? "#4a5957" : "#d8ff67");
      }
    });

    const outputGlow = ctx.createRadialGradient(
      outputPoint.x,
      outputPoint.y,
      2,
      outputPoint.x,
      outputPoint.y,
      Math.min(width, height) * 0.19,
    );
    const glowAlpha = step >= 5 ? 0.22 : 0.09;
    outputGlow.addColorStop(0, `rgba(216, 255, 103, ${glowAlpha})`);
    outputGlow.addColorStop(1, "rgba(216, 255, 103, 0)");
    ctx.fillStyle = outputGlow;
    ctx.fillRect(0, 0, width, height);

    const drawNode = (node, p, radius, active, muted = false) => {
      const baseAlpha = muted ? 0.28 : active ? 1 : 0.68;
      ctx.save();
      ctx.globalAlpha = baseAlpha;
      if (active) {
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 20;
      }
      ctx.fillStyle = "rgba(10, 25, 27, 0.94)";
      ctx.strokeStyle = node.color;
      ctx.lineWidth = active ? 2 : 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = node.color;
      ctx.font = `${Math.max(10, Math.min(15, width / 70))}px "Cascadia Code", Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(node.label, p.x, p.y + 4);
      ctx.fillStyle = "rgba(227, 244, 239, 0.62)";
      ctx.font = `${Math.max(8, Math.min(11, width / 100))}px "Cascadia Code", Consolas, monospace`;
      ctx.fillText(node.value, p.x, p.y + radius + 18);
      ctx.restore();
    };

    const inputActive = step >= 0;
    const hiddenActive = step >= 1;
    nodes.inputs.forEach((node, index) => {
      drawNode(node, inputPoints[index], Math.max(14, Math.min(27, width * 0.03)), inputActive);
    });
    nodes.hidden.forEach((node, index) => {
      const muted = index === 0 && step >= 3;
      drawNode(node, hiddenPoints[index], Math.max(13, Math.min(24, width * 0.027)), hiddenActive, muted);
    });
    drawNode(
      nodes.output,
      outputPoint,
      Math.max(21, Math.min(39, width * 0.045)),
      step >= 5,
    );

    ctx.save();
    ctx.fillStyle = "rgba(118, 146, 141, 0.72)";
    ctx.font = '9px "Cascadia Code", Consolas, monospace';
    ctx.textAlign = "center";
    ctx.fillText("INPUT", width * 0.13, height * 0.87);
    ctx.fillText("HIDDEN", width * 0.49, height * 0.92);
    ctx.fillText("OUTPUT", width * 0.84, height * 0.87);
    ctx.restore();
  }

  function drawRoute(time) {
    const points = shipStops.map((stop) => ({ x: stop.x * width, y: stop.y * height }));
    ctx.save();
    ctx.setLineDash([4, 7]);
    ctx.lineDashOffset = reducedMotion.matches ? 0 : -time / 45;
    ctx.strokeStyle = "rgba(216, 255, 103, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.stroke();
    ctx.restore();

    points.forEach((p, index) => {
      const current = index === step;
      const done = index < step;
      ctx.save();
      ctx.fillStyle = current ? "#d8ff67" : done ? "#7bdff2" : "rgba(126, 153, 148, 0.32)";
      if (current) {
        ctx.shadowColor = "#d8ff67";
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, current ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawShip(time) {
    const x = currentShip.x * width;
    const y = currentShip.y * height;
    const previous = shipStops[Math.max(0, targetIndex - 1)] || shipStops[0];
    const angle = Math.atan2((targetShip.y - previous.y) * height, (targetShip.x - previous.x) * width);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Number.isFinite(angle) ? angle : 0);
    ctx.shadowColor = "#d8ff67";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "#d8ff67";
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-8, 6);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-8, -6);
    ctx.closePath();
    ctx.fill();

    if (!reducedMotion.matches && step >= 0) {
      ctx.fillStyle = "rgba(123, 223, 242, 0.55)";
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-23 - Math.sin(time / 80) * 5, 0);
      ctx.lineTo(-8, 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function draw(time) {
    drawBackground(time);
    drawRoute(time);
    drawNetwork(time);
    drawShip(time);
  }

  function loop(time) {
    const dt = Math.min(0.04, (time - lastTime) / 1000);
    lastTime = time;
    const ease = reducedMotion.matches ? 1 : 1 - Math.pow(0.0002, dt);
    currentShip.x += (targetShip.x - currentShip.x) * ease;
    currentShip.y += (targetShip.y - currentShip.y) * ease;
    draw(time);
    window.requestAnimationFrame(loop);
  }

  createTrack();
  render();
  resizeCanvas();

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    draw(performance.now());
  });
  resizeObserver.observe(canvas);

  els.next.addEventListener("click", nextStep);
  els.prev.addEventListener("click", previousStep);
  els.reset.addEventListener("click", resetExperience);
  els.auto.addEventListener("click", () => {
    if (autoTimer) {
      stopAuto();
    } else {
      startAuto();
    }
  });

  els.heroLaunch.addEventListener("click", () => {
    goTo(0);
    window.setTimeout(() => canvas.focus({ preventScroll: true }), 500);
  });

  els.cards.forEach((card) => {
    const activate = () => focusCockpit(Number(card.dataset.step));
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });

  canvas.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === " ") {
      event.preventDefault();
      nextStep();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      previousStep();
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(stations.length - 1);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
  });

  window.requestAnimationFrame(loop);
})();
