Option Explicit

' わいわい広場 音声資料登録台帳
' HTML作成マクロ（複数レコード対応・音声なし対応版）
'
' A: 処理対象（チェックボックス / TRUE・FALSE）
' B: No.
' C: 使用中
' D: 資料タイトル
' E: 文字サイズ
' F: 音声ファイル（空欄可）
' G: PDF URL
' H: 表示モード（空欄＝通常、U＝音声と資料表示を分離）
' I: 登録日
' J: 修正日
' K: 記事
' L: HTMLコード
'
' 使い方：
' 1. A列でHTMLに組み込みたい行をチェックする
' 2. 「HTML作成」マクロを実行する
' 3. チェックされたレコードを上から順に1つのHTMLブロックへまとめる
' 4. 生成HTMLは、最初にチェックされた行のL列へ保存し、クリップボードへコピーする
'
' 音声ファイルが空欄の場合：
'   data-noaudio="true" を付け、共通スクリプト側で
'   🔳＋タイトルとして表示します。
'
Public Sub HTML作成()

    Dim ws As Worksheet
    Dim r As Long, firstRow As Long, selectedCount As Long
    Dim title As String, pdfUrl As String, audioFile As String
    Dim fontSize As String, displayMode As String
    Dim html As String
    Dim oneHtml As String

    Set ws = ThisWorkbook.Worksheets("資料登録台帳")

    html = ""
    firstRow = 0
    selectedCount = 0

    For r = 4 To ws.Cells(ws.Rows.Count, 2).End(xlUp).Row
        If IsTrueValue(ws.Cells(r, 1).Value) Then

            title = Trim(CStr(ws.Cells(r, 4).Value))
            fontSize = Trim(CStr(ws.Cells(r, 5).Value))
            audioFile = Trim(CStr(ws.Cells(r, 6).Value))
            pdfUrl = Trim(CStr(ws.Cells(r, 7).Value))
            displayMode = UCase(Trim(CStr(ws.Cells(r, 8).Value)))

            If title = "" Then
                MsgBox "No." & ws.Cells(r, 2).Value & " の「資料タイトル」が入力されていません。", vbExclamation
                Exit Sub
            End If

            ' 音声ファイルは空欄でも可

            If fontSize = "" Then fontSize = "20px"

            If displayMode <> "" And displayMode <> "U" Then
                MsgBox "No." & ws.Cells(r, 2).Value & " の「表示モード」は空欄または U を入力してください。", vbExclamation
                Exit Sub
            End If

            If displayMode = "U" And pdfUrl = "" Then
                MsgBox "No." & ws.Cells(r, 2).Value & " は表示モードが U のため、「PDF URL」が必須です。", vbExclamation
                Exit Sub
            End If

            oneHtml = BuildOneHtml(title, pdfUrl, audioFile, fontSize, displayMode)

            If html <> "" Then html = html & vbCrLf
            html = html & oneHtml

            If firstRow = 0 Then firstRow = r
            selectedCount = selectedCount + 1

            ' 選択された各レコードの修正日を更新
            ws.Cells(r, 10).Value = Date
        End If
    Next r

    If selectedCount = 0 Then
        MsgBox "A列の「処理対象」にチェックされたレコードがありません。", vbExclamation
        Exit Sub
    End If

    ' 共通音声・PDF表示スクリプトを追加
    html = html & vbCrLf & vbCrLf
    html = html & "<script src=""https://masa-ehara.github.io/AudioFiles/common-audio5.js""></script>"

    ' 複数レコードをまとめたHTMLは、最初の対象行のL列へ保存
    ws.Cells(firstRow, 12).Value = html

    CopyTextToClipboard html

    MsgBox selectedCount & "件のHTMLを1ブロックにまとめて作成しました。" & vbCrLf & _
           "音声なし資料も含め、最初の対象行のL列に保存し、クリップボードへコピーしました。", vbInformation

End Sub

Private Function BuildOneHtml(ByVal title As String, ByVal pdfUrl As String, _
                              ByVal audioFile As String, ByVal fontSize As String, _
                              ByVal displayMode As String) As String

    Dim html As String

    html = "<div class=""audio-player""" & vbCrLf
    html = html & "     data-title=""" & HtmlAttr(title) & """" & vbCrLf
    html = html & "     data-fntsize=""" & HtmlAttr(fontSize) & """"

    If audioFile <> "" Then
        html = html & vbCrLf & "     data-audio=""" & HtmlAttr(audioFile) & """"
    Else
        html = html & vbCrLf & "     data-noaudio=""true"""
    End If

    If pdfUrl <> "" Then
        html = html & vbCrLf & "     data-pdf=""" & HtmlAttr(pdfUrl) & """"
    End If

    If displayMode = "U" Then
        html = html & vbCrLf & "     data-mode=""U"""
    End If

    html = html & ">" & vbCrLf
    html = html & "</div>"

    BuildOneHtml = html
End Function

Private Function IsTrueValue(ByVal v As Variant) As Boolean
    If VarType(v) = vbBoolean Then
        IsTrueValue = CBool(v)
    Else
        IsTrueValue = (UCase(Trim(CStr(v))) = "TRUE" Or Trim(CStr(v)) = "1" Or Trim(CStr(v)) = "☑")
    End If
End Function

Private Function HtmlAttr(ByVal s As String) As String
    HtmlAttr = Replace(s, "&", "&amp;")
    HtmlAttr = Replace(HtmlAttr, """", "&quot;")
    HtmlAttr = Replace(HtmlAttr, "<", "&lt;")
    HtmlAttr = Replace(HtmlAttr, ">", "&gt;")
End Function

Private Sub CopyTextToClipboard(ByVal s As String)
    On Error Resume Next
    Dim d As Object
    Set d = CreateObject("Forms.DataObject")
    If Not d Is Nothing Then
        d.SetText s
        d.PutInClipboard
    End If
    On Error GoTo 0
End Sub
