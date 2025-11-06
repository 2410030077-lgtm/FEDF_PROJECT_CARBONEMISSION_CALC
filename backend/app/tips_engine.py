# tips_engine.py
from sklearn.cluster import KMeans
import numpy as np

# example tips
TIPS = [
    {"id":1, "tip":"Reduce electricity by 10%: use LED bulbs & timers"},
    {"id":2, "tip":"Reduce car usage: try 2 days/week public transport"},
    {"id":3, "tip":"Cut meat consumption twice weekly"},
    {"id":4, "tip":"Air-dry clothes to save dryer energy"},
    {"id":5, "tip":"Switch to renewable electricity plan"}
]

def recommend_tips(rows):
    # rows: list of dicts with ele, fuel, waste
    if not rows:
        # default tips
        return [t["tip"] for t in TIPS[:3]]
    X = np.array([[r.get("ele",0), r.get("fuel",0), r.get("waste",0)] for r in rows])
    # cluster for patterns
    try:
        k = min(3, max(1, X.shape[0]//2))
        km = KMeans(n_clusters=k, random_state=0).fit(X)
        center = km.cluster_centers_.mean(axis=0)
        # choose tip with highest matching center dimension
        idx = int(np.argmax(center))
        # mapping: 0=>electricity,1=>fuel,2=>waste
        if idx == 0:
            return [TIPS[0]["tip"], TIPS[3]["tip"]]
        elif idx == 1:
            return [TIPS[1]["tip"], TIPS[2]["tip"]]
        else:
            return [TIPS[2]["tip"], TIPS[3]["tip"]]
    except Exception:
        return [t["tip"] for t in TIPS[:3]]
