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
//             data-pdf が指定されていれば資料も新しいWindowで開く
//   音声なし：▪️＋表示名を表示
//             data-pdf が指定されていればクリックで資料を開く
//
// 【Uモード】data-mode="U"
//   音声あり：🔈 ボタン → 音声のみ再生／一時停止
//             表示名 → data-pdf を開く（Macは新しいWindow、iPhone/iPadは同一Window）
//   音声なし：▪️ ボタン＋表示名
//             表示名 → data-pdf を開く（Macは新しいWindow、iPhone/iPadは同一Window）
//
// 【再生状態表示】
//   再生中：⏸️
//   一時停止中：▶️（押すと一時停止位置から再開）
//   完全停止／再生終了：🔈（押すと最初から再生）
//
// 【停止ボタン】
//   初期状態：非表示
//   音声再生開始：表示
//   一時停止：非表示
//   再開：表示
//   停止：非表示
//   再生終了：非表示
//
// 【複数項目】
//   同一HTML内に .audio-player を複数配置可能。
//   各項目の下側余白は data-fntsize と同じ値。
//   したがって、音声あり／なしが混在しても同じ間隔で表示されます。

const AUDIO_BASE_URL = "https://masa-ehara.github.io/AudioFiles/";
// 共通スクリプトの更新版番号（HTML側のscript URLにも ?v=20261013-3 を付ける）
const COMMON_AUDIO_VERSION = "20261013-8";

// ----- 実行環境判定 -----
// Macだけ新しいWindowでPDFを開く。
// iPhone / iPadは、従来どおり同一Window内でPDFを表示する。
// iPadOSがMac風のUser-Agentを返す場合も考慮する。
const isMacEnvironment =
  /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent) &&
  !/iPhone|iPad|iPod/i.test(navigator.userAgent);

// ----- PDF表示 -----
// Mac：新しいWindowで表示
// iPhone / iPad：現在のWindowで表示
function openPdf(pdfUrl) {
  if (isMacEnvironment) {
    // 現在の元Windowを基準に、右上方向へPDF Windowを
    // 「はみ出させて」表示する。
    //
    // 重要：
    // left / top は画面右上からの固定値ではなく、
    // 現在Windowの screenX / screenY / outerWidth から計算する。
    // さらに moveTo() を使って、ブラウザが初期配置を変更した場合も
    // もう一度相対位置へ移動させる。
    const popupWidth = 1000;
    const popupHeight = 800;

    const currentLeft = window.screenX ?? window.screenLeft ?? 0;
    const currentTop = window.screenY ?? window.screenTop ?? 0;
    const currentWidth = window.outerWidth || window.innerWidth || 1200;

    const currentRight = currentLeft + currentWidth;

    // 元Windowの右端から約750px左をPDF Windowの左端とする。
    // その結果、PDF Windowは元Windowと大きく重なりながら、
    // 右側へ約250pxはみ出す。
    const left = Math.round(currentRight - 750);

    // 元Windowの上端より約150px上へ。
    const top = Math.round(currentTop - 150);

    const popup = window.open(
      pdfUrl,
      "pdfWindow",
      `popup=yes,width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (popup) {
      // ブラウザが初期配置を補正した場合に備えて、
      // 少し遅らせて相対位置を再指定する。
      setTimeout(() => {
        try {
          popup.moveTo(left, top);
          popup.resizeTo(popupWidth, popupHeight);
        } catch (e) {
          // ブラウザがWindow位置変更を禁止している場合は何もしない。
        }
      }, 100);
    }

    return popup;
  }

  // iPhone / iPad は従来動作を維持する。
  // window.location.href は Google Sites / Drive で403になる場合があるため使用しない。
  return window.open(pdfUrl, "_blank");
}

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
  if (isHeaderMode) {
    element.style.margin = "0";
    element.style.padding = "0";
    element.style.lineHeight = "1.2";
    element.style.marginBottom =
      index < audioPlayers.length - 1 ? fntsize : "0";
    element.style.listStyleType = "none";

    if (element.parentElement && element.parentElement.tagName === "LI") {
      element.parentElement.style.listStyleType = "none";
    }

    element.replaceChildren();

    const header = document.createElement("span");
    header.textContent = title;
    header.style.fontSize = fntsize;
    header.style.display = "block";
    header.style.verticalAlign = "middle";

    if (title === "") {
      header.style.height = fntsize;
    }

    element.appendChild(header);
    return;
  }

  // ----- 音声 -----
  let audio = null;
  if (!isNoAudio) {
    audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = AUDIO_BASE_URL + encodeURIComponent(fileName);
  }

  // ----- 表示領域 -----
  element.style.margin = "0";
  element.style.padding = "0";
  element.style.lineHeight = "1.2";
  element.style.marginBottom =
    index < audioPlayers.length - 1 ? fntsize : "0";

  element.replaceChildren();

  // ----- 音声再生／資料表示ボタン -----
  const playButton = document.createElement("button");
  playButton.type = "button";
  playButton.style.fontSize = fntsize;
  playButton.style.padding = "0px 4px";
  playButton.style.verticalAlign = "middle";

  // ===== ボタン枠・背景の扱い =====
  if (!isSeparatedMode && !isNoAudio) {
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
      playButton.textContent = "▪️";
      playButton.setAttribute("aria-label", `${title} 音声なし`);
      playButton.style.cursor = "default";
    } else {
      playButton.textContent = "🔈";
      playButton.setAttribute("aria-label", `${title} 音声を再生`);
    }
  } else {
    playButton.textContent = (isNoAudio ? "▪️" : "🔈 ") + title;
    if (isNoAudio && !pdfUrl) {
      playButton.style.cursor = "default";
    }
  }

  // ----- 表示名 -----
  let titleLink = null;

  if (isSeparatedMode) {
    titleLink = document.createElement("a");
    titleLink.textContent = title;

    titleLink.style.fontSize = fntsize;
    titleLink.style.color = "#06c";
    titleLink.style.textDecoration = "underline";
    titleLink.style.display = "inline-block";
    titleLink.style.cursor = pdfUrl ? "pointer" : "default";
    titleLink.style.verticalAlign = "middle";

    element.appendChild(playButton);
    element.appendChild(document.createTextNode(" "));
    element.appendChild(titleLink);
  } else {
    element.appendChild(playButton);
  }

  // ----- 停止ボタン／同幅スペース -----
  const stopSpace = document.createElement("span");
  stopSpace.textContent = "⏹️";
  stopSpace.style.fontSize = fntsize;
  stopSpace.style.padding = "0px 2px";
  stopSpace.style.cursor = "pointer";
  stopSpace.style.verticalAlign = "middle";
  stopSpace.style.display = isNoAudio ? "none" : "inline-block";
  stopSpace.style.visibility = "hidden";
  stopSpace.setAttribute("role", "button");
  stopSpace.setAttribute("aria-label", `${title} 音声を停止`);

  element.appendChild(stopSpace);

  // ----- 音声あり項目の処理 -----
  if (!isNoAudio && audio) {
    // ⏹️による完全停止と通常の一時停止を区別するためのフラグ。
    let isStopping = false;

    playButton.addEventListener("click", async () => {
      try {
        if (audio.paused || audio.ended) {
          if (audio.ended) {
            audio.currentTime = 0;
          }

          // 音声再生を先に開始する。
          // iPhone / iPadでは、PDF画面遷移を先に行うと
          // 最初のクリックだけ音声が再生されないことがあるため、
          // 元の動作順序に戻す。
          // play() はユーザー操作直後に呼び出し、完了を待たずに
          // PDF表示へ進む。
          const playPromise = audio.play();

          if (!isSeparatedMode && pdfUrl) {
            openPdf(pdfUrl);
          }

          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              stopSpace.style.visibility = "hidden";
            });
          }
        } else {
          audio.pause();
        }
      } catch (e) {
        stopSpace.style.visibility = "hidden";
      }
    });

    // ----- 停止 -----
    stopSpace.addEventListener("click", () => {
      isStopping = true;
      audio.pause();
      audio.currentTime = 0;

      if (isSeparatedMode) {
        playButton.textContent = "🔈";
        playButton.setAttribute("aria-label", `${title} 音声を再生`);
      } else {
        playButton.textContent = "🔈 " + title;
      }

      stopSpace.style.visibility = "hidden";
    });

    // ----- 再生開始 -----
    audio.addEventListener("play", () => {
      if (isSeparatedMode) {
        playButton.textContent = "⏸️";
        playButton.setAttribute("aria-label", `${title} 音声を一時停止`);
      } else {
        playButton.textContent = "⏸️ " + title;
      }

      stopSpace.style.visibility = "visible";
    });

    // ----- 一時停止 -----
    audio.addEventListener("pause", () => {
      if (isStopping) {
        if (isSeparatedMode) {
          playButton.textContent = "🔈";
          playButton.setAttribute("aria-label", `${title} 音声を再生`);
        } else {
          playButton.textContent = "🔈 " + title;
        }
        stopSpace.style.visibility = "hidden";
        isStopping = false;
        return;
      }

      if (!audio.ended) {
        if (isSeparatedMode) {
          playButton.textContent = "▶️";
          playButton.setAttribute("aria-label", `${title} 音声を再開`);
        } else {
          playButton.textContent = "▶️ " + title;
        }

        stopSpace.style.visibility = "hidden";
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

      stopSpace.style.visibility = "hidden";
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
        openPdf(pdfUrl);
      });
    }
  }

  // ----- Uモード：表示名クリック -----
  // ここは audio / stopSpace の初期化が完了した後に登録する。
  // これにより、既存の表示生成処理には影響を与えない。
  if (isSeparatedMode && pdfUrl && titleLink) {
    titleLink.addEventListener("click", (e) => {
      e.preventDefault();

      // Macだけ：
      // 資料Windowを開くと同時に、停止中／一時停止中なら音声を開始／再開。
      // 再生中ならそのまま継続。
      if (isMacEnvironment && !isNoAudio && audio) {
        openPdf(pdfUrl);

        if (audio.paused || audio.ended) {
          if (audio.ended) {
            audio.currentTime = 0;
          }

          const playPromise = audio.play();

          if (playPromise && typeof playPromise.catch === "function") {
            playPromise.catch(() => {
              if (stopSpace) {
                stopSpace.style.visibility = "hidden";
              }
            });
          }
        }
      } else {
        // iPhone / iPad は従来どおり。
        openPdf(pdfUrl);
      }
    });
  }
});
