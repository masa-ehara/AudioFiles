// ===== 共通音声再生スクリプト =====
// 音声ファイルはHTML側の data-audio="001.mp3" で指定します。
// 音声ファイルを追加するたびに、このJavaScriptを変更する必要はありません。

const AUDIO_BASE_URL = "https://masa-ehara.github.io/AudioFiles/";

document.querySelectorAll(".audio-player").forEach((container) => {
  const fileName = container.dataset.audio;

  const audio = document.createElement("audio");
  audio.preload = "metadata";
  audio.src = AUDIO_BASE_URL + encodeURIComponent(fileName);

  const playButton = document.createElement("button");
//  playButton.textContent = "▶ 説明を聞く";
  playButton.textContent = "🔈 説明を聞く";
  playButton.style.fontSize = "16px";
  stopButton.style.padding = "10px 16px";
  playButton.style.marginRight = "8px";
  stopButton.style.cursor = "pointer";

  const stopButton = document.createElement("button");
//  stopButton.textContent = "■ 停止";
  stopButton.textContent = "⏹️";
  stopButton.style.fontSize = "16px";
　stopButton.style.border = "none";
　stopButton.style.background = "none";
  playButton.style.marginRight = "8px";
  playButton.style.cursor = "pointer";

  const status = document.createElement("span");
//  status.textContent = " 待機中";
  status.textContent = "";

  container.appendChild(playButton);
  container.appendChild(stopButton);
  container.appendChild(status);

  playButton.addEventListener("click", async () => {
    try {
      if (audio.paused || audio.ended) {
        if (audio.ended) audio.currentTime = 0;
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (e) {
      status.textContent = " 音声を再生できませんでした";
    }
  });

  stopButton.addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
//    playButton.textContent = "▶ 説明を聞く";
    playButton.textContent = "🔈 説明を聞く";
//    status.textContent = " 停止しました";
    status.textContent = "";
  });

  audio.addEventListener("play", () => {
//    playButton.textContent = "⏸ 一時停止";
    playButton.textContent = "⏸️ 説明を聞く";
//    status.textContent = " ナレーション再生中…";
    status.textContent = "";
  });

  audio.addEventListener("pause", () => {
    if (!audio.ended) {
//      playButton.textContent = "▶ 再開";
//      status.textContent = " 一時停止中";
    playButton.textContent = "🔈 説明を聞く";
      status.textContent = "";
   }
  });

  audio.addEventListener("ended", () => {
//    playButton.textContent = "▶ もう一度聞く";
//    status.textContent = " 再生終了";
    playButton.textContent = "🔈 説明を聞く";
    status.textContent = "";
  });

  window.addEventListener("pagehide", () => {
    audio.pause();
    audio.currentTime = 0;
  });
});
