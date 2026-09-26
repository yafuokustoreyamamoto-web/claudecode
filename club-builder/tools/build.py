#!/usr/bin/env python3
"""選手データ(xlsx)をゲーム用の配列に変換し、src/game.html に src/game.js・src/ui.js と一緒に埋め込んで index.html を作る。

使い方: python3 tools/build.py
必要: openpyxl (pip install openpyxl)
"""
import json
import pathlib

import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
XLSX = ROOT / "data" / "FCRJ_選手データ.xlsx"
TEMPLATE = ROOT / "src" / "game.html"
OUT = ROOT / "index.html"            # GitHub Pages などでそのまま開ける完全なHTML
FRAGMENT = ROOT / "dist" / "artifact.html"  # 外枠なし（claude.ai のアーティファクト公開用）


def rows(ws):
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r and r[0]:
            yield r


def num(v, default=0):
    return default if v is None else v


def main():
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    data = {
        # [名前, クラブ, カテゴリ, 年齢, ポジション, サブ, 評価, 将来性, 国籍, 移籍金(億)]
        "J": [[r[0], r[1], r[2], r[3], r[4], r[5] or "", r[6], num(r[7], r[6]), r[8] or "日本", num(r[9])]
              for r in rows(wb["Jリーグ選手"])],
        # [名前, クラブ, カテゴリ, ポジション, 評価(全盛期), 在籍期間]
        "JL": [[r[0], r[1], r[2], r[3], r[4], str(r[5] or "")] for r in rows(wb["Jレジェンド"])],
        # [名前, クラブ, リーグ, 年齢, ポジション, サブ, 評価, 国籍, 移籍金(億)]
        "EU": [[r[0], r[1], r[2], r[3], r[4], r[5] or "", r[6], r[7] or "", num(r[8])]
               for r in rows(wb["欧州選手"])],
        # [名前, クラブ, リーグ, ポジション, 評価(全盛期), 国籍]
        "EL": [[r[0], r[1], r[2], r[3], r[4], r[5] or ""] for r in rows(wb["欧州レジェンド"])],
        # [名前, 所属クラブ, 年齢, ポジション, サブ, 評価]
        "AB": [[r[0], r[1], r[2], r[3], r[4] or "", r[5]] for r in rows(wb["海外組の日本人"])],
    }
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    html = TEMPLATE.read_text(encoding="utf-8")
    marker = "/*__PLAYER_DATA__*/null"
    if marker not in html:
        raise SystemExit("テンプレートにデータの差し込み位置がありません")
    html = html.replace(marker, blob)
    for name in ("game.js", "ui.js"):
        tag = f'<script src="{name}"></script>'
        if tag not in html:
            raise SystemExit(f"{name} の読み込みタグがありません")
        js = (ROOT / "src" / name).read_text(encoding="utf-8")
        html = html.replace(tag, "<script>\n" + js + "\n</script>")
    FRAGMENT.parent.mkdir(exist_ok=True)
    FRAGMENT.write_text(html, encoding="utf-8")
    OUT.write_text('<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n'
                   '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                   + html.replace("<style>", "<style>\n:root{padding-top:env(safe-area-inset-top,0px)}", 1)
                   .replace('<div id="start"', '</head>\n<body>\n<div id="start"', 1)
                   + "\n</body>\n</html>\n", encoding="utf-8")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)",
          {k: len(v) for k, v in data.items()})


if __name__ == "__main__":
    main()
