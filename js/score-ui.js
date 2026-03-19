// ============================================
// score-ui.js — スコアボタンの共通定義と描画
// ============================================

window.addEventListener("load", function() {
    console.log("onload fired");
    setTimeout(() => {
        console.log("initScoreUI called");
        initScoreUI(); // ボタン生成
    }, 50); // 50ms 遅延させて DOM 確実に準備
});

const SCORE_CONFIG = {
  condition: {
    label: "体調",
    items: [
      { emoji: "🤧", label: "とても悪い", value: 1, cls: "score-taichou-1" },
      { emoji: "😷", label: "悪い",       value: 2, cls: "score-taichou-2" },
      { emoji: "🙂", label: "普通",       value: 3, cls: "score-taichou-3" },
      { emoji: "😊", label: "良い",       value: 4, cls: "score-taichou-4" },
      { emoji: "😄", label: "とても良い", value: 5, cls: "score-taichou-5" }
    ]
  },
  energy: {
    label: "活力",
    items: [
      { battery: 20,  value: 1, cls: "score-katsu-1" },
      { battery: 40,  value: 2, cls: "score-katsu-2" },
      { battery: 60,  value: 3, cls: "score-katsu-3" },
      { battery: 80,  value: 4, cls: "score-katsu-4" },
      { battery: 100, value: 5, cls: "score-katsu-5" }
    ]
  },
  mental: {
    label: "メンタル",
    items: [
      { emoji: "⛈️", label: "最悪", value: 1, cls: "score-mental-1" },
      { emoji: "🌧️", label: "悪い", value: 2, cls: "score-mental-2" },
      { emoji: "☁️",  label: "普通", value: 3, cls: "score-mental-3" },
      { emoji: "🌤️", label: "良い", value: 4, cls: "score-mental-4" },
      { emoji: "☀️",  label: "最高", value: 5, cls: "score-mental-5" }
    ]
  }
};

const BATTERY_COLORS = {
  20:  "#e57373",
  40:  "#ffb74d",
  60:  "#ffd54f",
  80:  "#aed581",
  100: "#4CAF50"
};

function createScoreButtons() {
  Object.keys(SCORE_CONFIG).forEach(scoreId => {
    const config = SCORE_CONFIG[scoreId];
    const container = document.getElementById(scoreId);
    if (!container) return;
    container.innerHTML = "";

    config.items.forEach(item => {
      const btn = document.createElement("button");
      btn.className = `score-emoji-btn ${item.cls}`;
      btn.dataset.value = item.value;
      btn.type = "button";

      if (scoreId === "energy") {
        btn.appendChild(createBatteryIcon(item.battery));
      } else {
        const emojiSpan = document.createElement("span");
        emojiSpan.className = "score-emoji";
        emojiSpan.textContent = item.emoji;
        btn.appendChild(emojiSpan);

        const labelSpan = document.createElement("span");
        labelSpan.className = "score-label";
        labelSpan.textContent = item.label;
        btn.appendChild(labelSpan);
      }

      btn.onclick = () => {
        container.querySelectorAll(".score-emoji-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      };

      container.appendChild(btn);
    });
  });
}

function createBatteryIcon(percent) {
  const wrapper = document.createElement("div");
  wrapper.className = "battery-icon";

  const fill = document.createElement("div");
  fill.className = "battery-fill";
  fill.style.width = `calc(${percent}% - 2px)`;
  fill.style.background = BATTERY_COLORS[percent] || "#4CAF50";

  const text = document.createElement("span");
  text.className = "battery-text";
  text.textContent = percent + "%";

  wrapper.appendChild(fill);
  wrapper.appendChild(text);
  return wrapper;
}