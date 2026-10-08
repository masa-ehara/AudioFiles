// @ts-check
// ===== 共通音声再生・PDF表示スクリプト =====
// 音声ファイルはHTML側の data-audio で指定します。
// PDF/リンク先は data-pdf で指定します。
// 第5パラメーター相当：data-mode="U" の場合、
// 音声操作と表示名（リンク）を分離します。

const AUDIO_BASE_URL = "https://masa-ehara.github.io/AudioFiles/";

const audioPlayers = Array.from(document.querySelectorAll(".audio-player"));

audioPlayers.forEach((container, index) => {
  const element = /** @type {HTMLElement} */ (container);

  const fileName = element.dataset.audio ?? "";
  const title = element.dataset.title ?? "";
  const fntsize = element.dataset.fntsize ?? "16px";
  const pdfUrl = element.dataset.pdf ?? "";
  const mode = (element.dataset.mode ?? "").toUpperCase();

  const isSeparatedMode = mode === "U";

  const audio = document.createElement("audio");
  audio.preload = "metadata";
  audio.src = AUDIO_BASE_URL + encodeURIComponent(fileName);

  element.style.margin = "0";
  element.style.padding = "0";
  element.style.lineHeight = "1.2";
  element.style.marginBottom =
    index < audioPlayers.length - 1 ? fntsize : "0";

  element.replaceChildren();

  // ------------------------------------------------------------
  // 再生／一時停止ボタン
  // ------------------------------------------------------------
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.style.fontSize = fntsize;
  playButton.style.cursor = "pointer";
  playButton.style.verticalAlign = "middle";

  if (isSeparatedMode) {
    // Uモードではボタンの枠を完全に消す
    playButton.style.padding = "0";
    playButton.style.margin = "0 4px 0 0";
    playButton.style.setProperty("border", "none", "important");
    playButton.style.setProperty("outline", "none", "important");
    playButton.style.setProperty("background", "transparent", "important");
    playButton.style.setProperty("box-shadow", "none", "important");
    playButton.style.setProperty("appearance", "none", "important");
    playButton.style.setProperty("-webkit-appearance", "none", "important");

    playButton.textContent = "🔈";
    playButton.setAttribute("aria-label", `${title} 音声を再生`);
  } else {
    playButton.style.padding = "0px 4px";
    playButton.textContent = "🔈 " + title;
  }

  element.appendChild(playButton);

  // ------------------------------------------------------------
  // Uモードの表示名リンク
  // ------------------------------------------------------------
  if (isSeparatedMode) {
    const titleLink = document.createElement("a");

    titleLink.textContent = title;
    titleLink.href = pdfUrl || "#";
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";
    titleLink.style.fontSize = fntsize;
    titleLink.style.cursor = pdfUrl ? "pointer" : "default";
    titleLink.style.verticalAlign = "middle";

    if (!pdfUrl) {
      titleLink.removeAttribute("href");
      titleLink.removeAttribute("target");
      titleLink.removeAttribute("rel");
    }

    element.appendChild(titleLink);
  }

  // ------------------------------------------------------------
  // 停止ボタン
  // ------------------------------------------------------------
  const stopButton = document.createElement("button");

  stopButton.type = "button";
  stopButton.textContent = "⏹️";
  stopButton.style.fontSize = fntsize;
  stopButton.style.border = "none";
  stopButton.style.background = "none";
  stopButton.style.padding = "0px 2px";
  stopButton.style.cursor = "pointer";
  stopButton.style.verticalAlign = "middle";
  stopButton.style.display = "none";

  element.appendChild(stopButton);

  const status = document.createElement("span");
  status.textContent = "";
  element.appendChild(status);

  // ------------------------------------------------------------
  // 停止操作中フラグ
  //
  // 重要：
  // audio.pause() の pause イベントが、stopButton のクリック処理
  // より後に発生する環境があるため、
  // 停止処理の最後で false に戻さない。
  //
  // 次に play が発生した時だけ false に戻す。
  // ------------------------------------------------------------
  let stopRequested = false;

  // ------------------------------------------------------------
  // 再生／一時停止ボタン
  // ------------------------------------------------------------
  playButton.addEventListener("click", async () => {
    try {
      if (audio.paused || audio.ended) {
        // ユーザーが新たに再生を開始したので、停止要求を解除する。
        stopRequested = false;

        if (audio.ended) {
          audio.currentTime = 0;
        }

        await audio.play();

        // Uモードでない従来モードでは、
        // 再生開始時にリンク先を新しいタブで開く。
        if (!isSeparatedMode && pdfUrl) {
          window.open(pdfUrl, "_blank");
        }
      } else {
        // 一時停止
        audio.pause();
      }
    } catch (e) {
      status.textContent = " 音声を再生できませんでした";
      stopButton.style.display = "none";
    }
  });

  // ------------------------------------------------------------
  // 停止ボタン
  // ------------------------------------------------------------
  // pointerdown の時点で先に非表示にする。
  // Google Sites 側の click / pause イベントの順序に左右されないようにする。
  stopButton.addEventListener("pointerdown", () => {
    stopRequested = true;
    stopButton.style.display = "none";
  });

  stopButton.addEventListener("click", () => {
    // 停止要求を記録する。
    // このフラグは次回 play まで解除しない。
    stopRequested = true;

    // 念のため click 処理の冒頭でも非表示。
    stopButton.style.display = "none";

    audio.pause();
    audio.currentTime = 0;

    if (isSeparatedMode) {
      playButton.textContent = "🔈";
      playButton.setAttribute("aria-label", `${title} 音声を再生`);
    } else {
      playButton.textContent = "🔈 " + title;
    }

    // pauseイベントが先に/後に発生しても、最後に必ず非表示にする。
    stopButton.style.display = "none";
    status.textContent = "";
  });

  // ------------------------------------------------------------
  // 再生開始
  // ------------------------------------------------------------
  audio.addEventListener("play", () => {
    if (isSeparatedMode) {
      playButton.textContent = "⏸️";
      playButton.setAttribute("aria-label", `${title} 音声を一時停止`);
    } else {
      playButton.textContent = "⏸️ " + title;
    }

    // 停止操作の直後に遅れて play イベントが発生しても、
    // 停止ボタンを再表示しない。
    if (!stopRequested) {
      stopButton.style.display = "inline-block";
    }
    status.textContent = "";
  });

  // ------------------------------------------------------------
  // 一時停止
  // ------------------------------------------------------------
  audio.addEventListener("pause", () => {
    // 停止ボタンをクリックした結果の pause は無視する。
    //
    // stopRequested は次回 play まで true のままなので、
    // pause イベントが非同期で遅れて発生しても、
    // 停止ボタンが再表示されることはない。
    if (stopRequested) {
      return;
    }

    if (!audio.ended) {
      if (isSeparatedMode) {
        playButton.textContent = "🔈";
        playButton.setAttribute("aria-label", `${title} 音声を再生`);
      } else {
        playButton.textContent = "🔈 " + title;
      }

      // 通常の一時停止では停止ボタンを残す。
      stopButton.style.display = "inline-block";
      status.textContent = "";
    }
  });

  // ------------------------------------------------------------
  // 再生終了
  // ------------------------------------------------------------
  audio.addEventListener("ended", () => {
    stopRequested = false;

    if (isSeparatedMode) {
      playButton.textContent = "🔈";
      playButton.setAttribute("aria-label", `${title} 音声を再生`);
    } else {
      playButton.textContent = "🔈 " + title;
    }

    stopButton.style.display = "none";
    status.textContent = "";
  });

  // ------------------------------------------------------------
  // ページを離れる場合
  // ------------------------------------------------------------
  window.addEventListener("pagehide", () => {
    stopRequested = true;
    audio.pause();
    audio.currentTime = 0;
  });
});
