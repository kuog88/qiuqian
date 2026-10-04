#!/usr/bin/env python3
"""把 data/src/*.txt 的籤詩原稿編譯成 poems.json。
格式：「## 男 春」為區塊標題，其下五行依序為 上上、上吉、中吉、中平、中下。
每行：四句詩（以，分隔）|白話解釋|宜（以、分隔）|忌（以、分隔）
用法：python3 tools/build_poems.py
"""
import json, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
CATS = [("career", "事業"), ("health", "健康"), ("love", "感情"), ("fortune", "運勢")]
LV = ["上上", "上吉", "中吉", "中平", "中下"]; SEA = ["春", "夏", "秋", "冬"]
poems, errs, no = [], [], 0
for cat, _ in CATS:
    blocks, cur = {}, None
    for line in (ROOT / "data/src" / f"{cat}.txt").read_text(encoding="utf8").splitlines():
        line = line.strip()
        if not line: continue
        if line.startswith("##"):
            cur = tuple(line[2:].split()); blocks[cur] = []; continue
        blocks[cur].append(line)
    for g in ["男", "女"]:
        for s in SEA:
            rows = blocks.get((g, s), [])
            if len(rows) != 5: errs.append(f"{cat} {g}{s}: 需要 5 首，目前 {len(rows)} 首")
            for i, r in enumerate(rows[:5]):
                p = r.split("|")
                if len(p) != 4: errs.append(f"{cat} {g}{s} 第{i+1}首：欄位數不是 4"); continue
                lines = p[0].split("，")
                if len(lines) != 4 or any(len(l) != 7 for l in lines): errs.append(f"{cat} {g}{s} 第{i+1}首：需為四句七言")
                no += 1
                poems.append({"no": no, "cat": cat, "gender": g, "season": s, "level": LV[i], "lines": lines,
                              "meaning": p[1], "yi": p[2].split("、"), "ji": p[3].split("、")})
if errs:
    print("\n".join(errs)); sys.exit(1)
out = {"version": 2, "levels": LV, "seasons": SEA, "categories": dict(CATS), "poems": poems}
(ROOT / "poems.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf8")
print(f"已產生 poems.json，共 {len(poems)} 首")
