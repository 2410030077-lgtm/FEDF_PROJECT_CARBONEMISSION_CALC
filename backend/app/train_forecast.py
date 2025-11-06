# train_forecast.py
import os, glob
import pandas as pd
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.preprocessing import MinMaxScaler
import joblib
from datetime import datetime

DATA_DIR = "../data/cleaned"
MODEL_OUT = "../models/forecast_model.h5"
SCALER_OUT = "../models/forecast_scaler.save"

def load_all():
    files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    if not files:
        raise FileNotFoundError("No cleaned CSVs in data/cleaned")
    df = pd.concat([pd.read_csv(f) for f in files], ignore_index=True)
    # ensure date sorting
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
    return df

def prepare_sequences(df, seq_len=6):
    # Use features electricity, fuel, waste; target monthly_co2_kg
    df = df[['electricity_kwh_month','fuel_liters_month','waste_kg_month','monthly_co2_kg']].fillna(0)
    scaler = MinMaxScaler()
    data_scaled = scaler.fit_transform(df)
    X, y = [], []
    for i in range(seq_len, len(data_scaled)):
        X.append(data_scaled[i-seq_len:i, :3])  # features
        y.append(data_scaled[i, 3])            # target
    X, y = np.array(X), np.array(y)
    return X, y, scaler

def build_model(timesteps, features):
    model = Sequential()
    model.add(LSTM(128, input_shape=(timesteps, features), return_sequences=True))
    model.add(BatchNormalization())
    model.add(Dropout(0.2))
    model.add(LSTM(64))
    model.add(Dense(32, activation='relu'))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def train_and_save(seq_len=6, epochs=50):
    df = load_all()
    X, y, scaler = prepare_sequences(df, seq_len=seq_len)
    if len(X) < 10:
        raise ValueError("Not enough samples to train")
    model = build_model(X.shape[1], X.shape[2])
    chk = ModelCheckpoint(MODEL_OUT, save_best_only=True, monitor='val_loss', verbose=1)
    es = EarlyStopping(monitor='val_loss', patience=7, restore_best_weights=True)
    model.fit(X, y, validation_split=0.15, epochs=epochs, batch_size=16, callbacks=[chk, es])
    joblib.dump(scaler, SCALER_OUT)
    print("Saved model to", MODEL_OUT)
    return {"status":"ok", "model": MODEL_OUT}

if __name__ == "__main__":
    print(train_and_save())
