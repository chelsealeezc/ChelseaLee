(function () {
  const video = document.getElementById("heroVideo");
  const timeReadout = document.getElementById("timeReadout");
  const typedText = document.getElementById("typedText");
  const cursor = document.getElementById("cursor");
  const actions = document.getElementById("heroActions");
  const copyEmail = document.getElementById("copyEmail");

  const SENSITIVITY = 0.8;
  const INTRO_TEXT =
    "你好，我是李梓萃。来自北京大学信息管理系。自主开发了3个AI产品，其中一个已有160+活跃用户。在3家互联网公司做产品经理实习，把用户洞察、AI 能力和商业化变现目标链接在一起，是我最擅长的工作。";

  let prevX = null;
  let targetTime = 0;
  let isSeeking = false;
  let hasMetadata = false;
  let pendingSeek = false;
  let objectPosition = window.matchMedia("(max-width: 840px)").matches ? 74 : 82;
  let personShift = 0;
  let seekWatchdog = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "00:00";
    const whole = Math.max(0, Math.floor(seconds));
    const minutes = String(Math.floor(whole / 60)).padStart(2, "0");
    const secs = String(whole % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function updateReadout() {
    timeReadout.textContent = formatTime(targetTime);
  }

  function requestSeek() {
    if (!hasMetadata || !Number.isFinite(video.duration)) return;

    if (isSeeking) {
      pendingSeek = true;
      return;
    }

    if (Math.abs(video.currentTime - targetTime) < 0.015) {
      updateReadout();
      return;
    }

    isSeeking = true;
    pendingSeek = false;

    try {
      video.currentTime = targetTime;
      window.clearTimeout(seekWatchdog);
      seekWatchdog = window.setTimeout(() => {
        if (!isSeeking) return;

        isSeeking = false;

        if (Math.abs(video.currentTime - targetTime) >= 0.015) {
          requestSeek();
        }
      }, 700);
    } catch (error) {
      isSeeking = false;
    }
  }

  function handleHorizontalMove(event) {
    if (!hasMetadata || !Number.isFinite(video.duration) || video.duration <= 0) {
      prevX = event.clientX;
      return;
    }

    if (prevX === null) {
      prevX = event.clientX;
      return;
    }

    const delta = event.clientX - prevX;
    prevX = event.clientX;

    if (delta === 0) return;

    const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
    targetTime = clamp(targetTime + timeOffset, 0, video.duration);

    objectPosition = clamp(objectPosition + (delta / window.innerWidth) * 10, 74, 90);
    personShift = clamp(personShift + (delta / window.innerWidth) * 34, -22, 22);
    video.style.objectPosition = `${objectPosition}% center`;
    video.style.setProperty("--person-shift", `${personShift}px`);

    updateReadout();
    requestSeek();
  }

  function startTypewriter() {
    let index = 0;
    const startDelay = 520;
    const speed = 34;

    window.setTimeout(() => {
      const timer = window.setInterval(() => {
        typedText.textContent = INTRO_TEXT.slice(0, index + 1);
        index += 1;

        if (index >= INTRO_TEXT.length) {
          window.clearInterval(timer);
          cursor.style.display = "none";
        }
      }, speed);
    }, startDelay);
  }

  video.addEventListener("loadedmetadata", () => {
    hasMetadata = true;
    targetTime = clamp(video.currentTime || 0, 0, video.duration || 0);
    video.pause();
    updateReadout();
  });

  video.addEventListener("canplay", () => {
    video.pause();
  });

  video.addEventListener("play", () => {
    video.pause();
  });

  video.addEventListener("seeked", () => {
    window.clearTimeout(seekWatchdog);
    isSeeking = false;
    updateReadout();

    if (pendingSeek || Math.abs(video.currentTime - targetTime) >= 0.015) {
      requestSeek();
    }
  });

  window.addEventListener("mousemove", handleHorizontalMove, { passive: true });
  window.addEventListener("blur", () => {
    prevX = null;
  });

  window.setTimeout(() => {
    actions.classList.add("is-visible");
  }, 400);

  copyEmail.addEventListener("click", async () => {
    const email = "zicuili25@stu.pku.edu.cn";

    try {
      await navigator.clipboard.writeText(email);
      copyEmail.querySelector("span").textContent = "已复制邮箱";
      window.setTimeout(() => {
        copyEmail.querySelector("span").textContent = email;
      }, 1600);
    } catch (error) {
      window.location.href = `mailto:${email}`;
    }
  });

  async function hydrateVideoForScrubbing() {
    const source = video.currentSrc || video.getAttribute("src");
    if (!source || !window.fetch || !window.URL || source.startsWith("blob:")) {
      video.load();
      return;
    }

    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error("Video preload failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      video.removeAttribute("src");
      video.src = objectUrl;
      video.load();
      video.pause();
    } catch (error) {
      video.load();
      video.pause();
    }
  }

  hydrateVideoForScrubbing();
  startTypewriter();
})();
