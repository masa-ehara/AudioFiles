// @ts-check
//
// ===== 共通音声再生・PDF表示スクリプト 改良版 =====
// ・data-audio : 音声ファイル名（音声ありの場合）
// ・data-title : 表示名
// ・data-fntsize : 文字サイズ（省略時 16px）
// ・data-pdf : PDFまたはGoogle Driveフォルダ等の表示先URL
// ・data-mode : "U" の場合、音声操作と資料表示を分離
// ・data-noaudio : "true" の場合、音声なし資料として表示
//
// 【通常モード】data-mode を省略
//   音声あり：🔈 ボタンで音声再生／一時停止
//             data-pdf が指定されていれば資料も新しいタブで開く
//   音声なし：▪️＋表示名を表示
//             data-pdf が指定されていればクリックで資料を開く
//
// 【Uモード】data-mode="U"
//   音声あり：🔈 ボタン → 音声のみ再生／一時停止
//             表示名 → data-pdf を新しいタブで開く
//   音声なし：▪️ ボタン＋表示名
//             表示名 → data-pdf を新しいタブで開く
//
// 【停止ボタン】
//   初期状態：非表示
//   音声再生開始：表示
//   一時停止・再開：表示
//   停止：非表示
//   再生終了：非表示
//
// 【複数項目】
//   同一HTML内に .audio-player を複数配置可能。
//   各項目の下側余白は data-fntsize と同じ値。
//   したがって、音声あり／なしが混在しても同じ間隔で表示されます。

const AUDIO_BASE_URL = "https://masa-ehara.github.io/AudioFiles/";

const audioPlayers = Array.from(document.querySelectorAll(".audio-player"));

audioPlayers.forEach((container, index) => {
  const element = /** @type {HTMLElement} */ (container);

  const fileName = element.dataset.audio ?? "";
  const title = element.dataset.title ?? "";
  const fntsize = element.dataset.fntsize ?? "16px";
  const pdfUrl = element.dataset.pdf ?? "";
  const mode = (element.dataset.mode ?? "").toUpperCase();
  const isNoAudio =
    (element.dataset.noaudio ?? "").toLowerCase() === "true" || !fileName;

  const isHeaderMode = mode === "H";
  const isSeparatedMode = mode === "U";

  // ----- H（Header）モード -----
  // Hモードはタイトルだけを表示し、先頭記号・音声ボタン・PDF表示は行わない。
  if (isHeaderMode) {
    const header = document.createElement("span");
    header.textContent = title;
    header.style.fontSize = fntsize;
    header.style.display = "inline-block";
    header.style.verticalAlign = "middle";
    element.appendChild(header);
    return;
  }

  // ----- 音声 -----
  // 音声なし項目では audio 要素そのものを作成しない。
  let audio = null;
  if (!isNoAudio) {
    audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = AUDIO_BASE_URL + encodeURIComponent(fileName);
  }

  // ----- 表示領域 -----
  // 複数項目を1ブロックに入れた場合、
  // 各項目の間隔を文字サイズと同じ値にする。
  element.style.margin = "0";
  element.style.padding = "0";
  element.style.lineHeight = "1.2";
  // 項目間の間隔だけを設定し、最後の項目の下には余白を付けない。
  element.style.marginBottom =
    index < audioPlayers.length - 1 ? fntsize : "0";

  // 既存HTMLから生成物が二重になるのを防止
  element.replaceChildren();

  // ----- 音声再生／資料表示ボタン -----
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.style.fontSize = fntsize;
  playButton.style.padding = "0px 4px";
  playButton.style.verticalAlign = "middle";

  // ===== ボタン枠・背景の扱い =====
  // 通常モード＋音声ありだけ、外枠＋グレー背景を表示。
  // Uモード（音声あり／なし）と音声なし項目は枠・背景なし。
  // Google Sites側のbutton CSSに負けないよう !important を使用する。
  if (!isSeparatedMode && !isNoAudio) {
    // 通常モード：以前の表示と同じく、グレー背景＋外枠。
    // appearance は native 描画に任せず、CSSで背景色を確実に表示する。
    playButton.style.setProperty("border", "1px solid #767676", "important");
    playButton.style.setProperty("border-radius", "2px", "important");
    playButton.style.setProperty("background-color", "#ededed", "important");
    playButton.style.setProperty("background-image", "none", "important");
    playButton.style.setProperty("box-shadow", "none", "important");
    playButton.style.setProperty("appearance", "none", "important");
    playButton.style.setProperty("-webkit-appearance", "none", "important");
  } else {
    playButton.style.setProperty("border", "none", "important");
    playButton.style.setProperty("border-radius", "0", "important");
    playButton.style.setProperty("background", "transparent", "important");
    playButton.style.setProperty("box-shadow", "none", "important");
    playButton.style.setProperty("appearance", "none", "important");
  }

  playButton.style.cursor = "pointer";

  // Uモードでは音声ボタンと表示名を分離
  if (isSeparatedMode) {
    if (isNoAudio) {
      playButton.textContent = "◾️";
      playButton.setAttribute("aria-label", `${title} 音声なし`);
      playButton.style.cursor = "default";
    } else {
      playButton.textContent = "🔈";
      playButton.setAttribute("aria-label", `${title} 音声を再生`);
    }
  } else {
    playButton.textContent = (isNoAudio ? "◾️" : "🔈 ") + title;
    if (isNoAudio && !pdfUrl) {
      playButton.style.cursor = "default";
    }
  }

  // ----- 表示名 -----
  let titleLink = null;

  if (isSeparatedMode) {
    titleLink = document.createElement("a");
    titleLink.textContent = title;
    titleLink.href = pdfUrl || "#";
    titleLink.target = "_blank";
    titleLink.rel = "noopener noreferrer";
    titleLink.style.fontSize = fntsize;
    titleLink.style.color = "#06c";
    titleLink.style.textDecoration = "underline";
    titleLink.style.display = "inline-block";
    titleLink.style.cursor = pdfUrl ? "pointer" : "default";
    titleLink.style.verticalAlign = "middle";

    // Uモードでは表示名を常時下線表示。
    // PDF/フォルダURLがない場合はクリックしても遷移しない。
    if (!pdfUrl) {
      titleLink.removeAttribute("href");
      titleLink.removeAttribute("target");
      titleLink.removeAttribute("rel");
    }

    element.appendChild(playButton);
    element.appendChild(document.createTextNode(" "));
    element.appendChild(titleLink);
  } else {
    element.appendChild(playButton);
  }

  // ----- 停止ボタン -----
  const stopButton = document.createElement("button");
  stopButton.type = "button";
  stopButton.textContent = "⏹️";
  stopButton.style.fontSize = fntsize;
  stopButton.style.border = "none";
  stopButton.style.background = "none";
  stopButton.style.padding = "0px 2px";
  stopButton.style.cursor = "pointer";
  stopButton.style.verticalAlign = "middle";

  // 初期状態では非表示
  stopButton.style.display = "none";

  element.appendChild(stopButton);

  // ----- ステータス -----
  const status = document.createElement("span");
  status.textContent = "";
  element.appendChild(status);

  // ----- 音声あり項目の処理 -----
  if (!isNoAudio && audio) {
    playButton.addEventListener("click", async () => {
      try {
        if (audio.paused || audio.ended) {
          if (audio.ended) {
            audio.currentTime = 0;
          }

          await audio.play();

          // 通常モードでは従来どおり、
          // 音声ボタンのクリックで資料も開く。
          // Uモードでは資料表示を行わない。
          if (!isSeparatedMode && pdfUrl) {
            window.open(pdfUrl, "_blank");
          }
        } else {
          audio.pause();
        }
      } catch (e) {
        status.textContent = " 音声を再生できませんでした";
        stopButton.style.display = "none";
      }
    });

    // ----- 停止 -----
    stopButton.addEventListener("click", () => {
      audio.pause();
      audio.currentTime = 0;

      if (isSeparatedMode) {
        playButton.textContent = "🔈";
        playButton.setAttribute("aria-label", `${title} 音声を再生`);
      } else {
        playButton.textContent = "🔈 " + title;
      }

      stopButton.style.display = "none";
      status.textContent = "";
    });

    // ----- 再生開始 -----
    audio.addEventListener("play", () => {
      if (isSeparatedMode) {
        playButton.textContent = "⏸️";
        playButton.setAttribute("aria-label", `${title} 音声を一時停止`);
      } else {
        playButton.textContent = "⏸️ " + title;
      }

      stopButton.style.display = "inline-block";
      status.textContent = "";
    });

    // ----- 一時停止 -----
    audio.addEventListener("pause", () => {
      if (!audio.ended) {
        if (isSeparatedMode) {
          playButton.textContent = "🔈";
          playButton.setAttribute("aria-label", `${title} 音声を再生`);
        } else {
          playButton.textContent = "🔈 " + title;
        }

        // 一時停止中は停止ボタンを表示したまま
        stopButton.style.display = "inline-block";
        status.textContent = "";
      }
    });

    // ----- 再生終了 -----
    audio.addEventListener("ended", () => {
      if (isSeparatedMode) {
        playButton.textContent = "🔈";
        playButton.setAttribute("aria-label", `${title} 音声を再生`);
      } else {
        playButton.textContent = "🔈 " + title;
      }

      stopButton.style.display = "none";
      status.textContent = "";
    });

    // ----- ページ離脱 -----
    window.addEventListener("pagehide", () => {
      audio.pause();
      audio.currentTime = 0;
    });
  } else {
    // ----- 音声なし項目 -----
    // Uモードでは資料表示は表示名リンク側に任せる。
    // 通常モードでは、PDFがあれば ▪️＋表示名 のボタンから開く。
    if (!isSeparatedMode && pdfUrl) {
      playButton.addEventListener("click", () => {
        window.open(pdfUrl, "_blank");
      });
    }
  }
});
