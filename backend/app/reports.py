# reports.py
import matplotlib.pyplot as plt
import os
from db import get_session, EmissionLog
from sqlmodel import Session, select
import pandas as pd

def create_trend_plot(user_id, months=3, out="../models/report.png"):
    with next(get_session()) as s:
        logs = s.exec(select(EmissionLog).where(EmissionLog.user_id==user_id).order_by(EmissionLog.created_at.desc()).limit(12)).all()
    if not logs:
        raise ValueError("No logs")
    df = pd.DataFrame([{"date":l.created_at, "co2":l.monthly_co2_kg} for l in logs])
    df = df.sort_values("date").tail(months)
    plt.figure(figsize=(6,3))
    plt.plot(df['date'], df['co2'], marker='o')
    plt.title("Last months CO2 trend")
    plt.xlabel("Date")
    plt.ylabel("kg CO2")
    plt.tight_layout()
    plt.savefig(out)
    plt.close()
    return out
