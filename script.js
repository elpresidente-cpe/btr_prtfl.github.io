const yearElement = document.getElementById("year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear().toString();
}

const toggleButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

if (toggleButton && nav) {
  toggleButton.addEventListener("click", () => {
    const isExpanded = toggleButton.getAttribute("aria-expanded") === "true";
    toggleButton.setAttribute("aria-expanded", String(!isExpanded));
    nav.classList.toggle("open");
  });
}

const revealItems = [...document.querySelectorAll(".reveal")];
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
  observer.observe(item);
});

const canvas = document.getElementById("cyber-canvas");
if (canvas) {
  const context = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state = {
    width: 0,
    height: 0,
    devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    nodes: [],
    particles: [],
    pointer: { x: 0, y: 0, active: false, target: null, offsetX: 0, offsetY: 0 },
    frame: 0,
  };

  const nodeCount = () => (window.innerWidth < 720 ? 12 : 18);
  const particleCount = () => (window.innerWidth < 720 ? 32 : 56);

  const resizeCanvas = () => {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * state.devicePixelRatio);
    canvas.height = Math.floor(state.height * state.devicePixelRatio);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    context.setTransform(state.devicePixelRatio, 0, 0, state.devicePixelRatio, 0, 0);

    if (!state.nodes.length) {
      state.nodes = Array.from({ length: nodeCount() }, () => createNode());
    }

    state.nodes.forEach((node) => {
      node.x = Math.min(Math.max(node.x, 40), state.width - 40);
      node.y = Math.min(Math.max(node.y, 40), state.height - 40);
    });

    if (!state.particles.length) {
      state.particles = Array.from({ length: particleCount() }, () => createParticle());
    }
  };

  const createNode = (locked = false, x = Math.random() * state.width, y = Math.random() * state.height) => ({
    x,
    y,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    radius: 2.2 + Math.random() * 1.8,
    locked,
  });

  const createParticle = () => ({
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    radius: 0.8 + Math.random() * 1.9,
    life: Math.random(),
  });

  const gradientGlow = (x, y, radius, colorA, colorB, alpha = 1) => {
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(0.55, colorB);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    context.globalAlpha = alpha;
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  };

  const getPointerNode = (x, y) => {
    for (let index = state.nodes.length - 1; index >= 0; index -= 1) {
      const node = state.nodes[index];
      const distance = Math.hypot(x - node.x, y - node.y);
      if (distance < 18) {
        return node;
      }
    }
    return null;
  };

  const draw = () => {
    state.frame += 1;
    context.clearRect(0, 0, state.width, state.height);

    const purplePulse = 0.12 + Math.sin(state.frame * 0.01) * 0.06;
    context.fillStyle = `rgba(9, 5, 18, ${0.95 - purplePulse})`;
    context.fillRect(0, 0, state.width, state.height);

    // Ambient glows.
    gradientGlow(state.width * 0.15, state.height * 0.2, 220, "rgba(143, 86, 255, 0.35)", "rgba(143, 86, 255, 0.08)", 0.65);
    gradientGlow(state.width * 0.72, state.height * 0.82, 260, "rgba(212, 175, 55, 0.22)", "rgba(212, 175, 55, 0.05)", 0.42);
    gradientGlow(state.width * 0.88, state.height * 0.2, 180, "rgba(142, 31, 47, 0.24)", "rgba(142, 31, 47, 0.04)", 0.35);

    state.nodes.forEach((node) => {
      if (!node.locked) {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 30 || node.x > state.width - 30) node.vx *= -1;
        if (node.y < 30 || node.y > state.height - 30) node.vy *= -1;

        node.x = Math.min(Math.max(node.x, 30), state.width - 30);
        node.y = Math.min(Math.max(node.y, 30), state.height - 30);
      }
    });

    state.particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life += 0.008;

      if (particle.x < -20) particle.x = state.width + 20;
      if (particle.x > state.width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = state.height + 20;
      if (particle.y > state.height + 20) particle.y = -20;

      const shimmer = 0.45 + Math.sin(particle.life * 4) * 0.2;
      gradientGlow(
        particle.x,
        particle.y,
        10 + particle.radius * 2,
        `rgba(255, 226, 148, ${0.8 * shimmer})`,
        `rgba(212, 175, 55, ${0.2 * shimmer})`,
        0.75
      );
    });

    const maxDistance = Math.min(state.width, state.height) * 0.17;
    for (let index = 0; index < state.nodes.length; index += 1) {
      const node = state.nodes[index];
      for (let next = index + 1; next < state.nodes.length; next += 1) {
        const other = state.nodes[next];
        const distance = Math.hypot(node.x - other.x, node.y - other.y);
        if (distance > maxDistance) continue;

        const mix = 1 - distance / maxDistance;
        const lineAlpha = 0.08 + mix * 0.4;
        const isGold = (index + next + state.frame) % 7 === 0;

        context.lineWidth = isGold ? 1.8 : 1.15;
        context.strokeStyle = isGold
          ? `rgba(212, 175, 55, ${lineAlpha})`
          : `rgba(143, 86, 255, ${lineAlpha * 0.85})`;
        context.shadowBlur = isGold ? 18 : 12;
        context.shadowColor = isGold ? "rgba(212, 175, 55, 0.55)" : "rgba(143, 86, 255, 0.45)";
        context.beginPath();
        context.moveTo(node.x, node.y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }
    }

    if (state.pointer.active) {
      state.nodes.forEach((node) => {
        const distance = Math.hypot(state.pointer.x - node.x, state.pointer.y - node.y);
        if (distance < 140) {
          context.strokeStyle = `rgba(245, 216, 143, ${0.08 + (1 - distance / 140) * 0.24})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(state.pointer.x, state.pointer.y);
          context.lineTo(node.x, node.y);
          context.stroke();
        }
      });
    }

    state.nodes.forEach((node) => {
      const pulse = 1 + Math.sin(state.frame * 0.04 + node.x * 0.01) * 0.12;
      gradientGlow(node.x, node.y, 16 * pulse, "rgba(255, 241, 181, 0.6)", "rgba(212, 175, 55, 0.08)", 0.95);
      context.fillStyle = "rgba(255, 245, 204, 0.95)";
      context.shadowBlur = 20;
      context.shadowColor = "rgba(212, 175, 55, 0.8)";
      context.beginPath();
      context.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    });

    if (prefersReducedMotion) {
      return;
    }

    requestAnimationFrame(draw);
  };

  const movePointer = (event) => {
    state.pointer.x = event.clientX;
    state.pointer.y = event.clientY;
    if (state.pointer.target) {
      state.pointer.target.x = event.clientX - state.pointer.offsetX;
      state.pointer.target.y = event.clientY - state.pointer.offsetY;
    }
  };

  canvas.addEventListener("pointerdown", (event) => {
    const target = getPointerNode(event.clientX, event.clientY);
    if (!target) return;

    state.pointer.active = true;
    state.pointer.target = target;
    state.pointer.offsetX = event.clientX - target.x;
    state.pointer.offsetY = event.clientY - target.y;
    target.locked = true;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", movePointer);

  const releasePointer = () => {
    state.pointer.active = false;
    if (state.pointer.target) {
      state.pointer.target.locked = false;
      state.pointer.target = null;
    }
  };

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", () => {
    state.pointer.active = false;
  });

  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();

  if (!prefersReducedMotion) {
    requestAnimationFrame(draw);
  }
}
