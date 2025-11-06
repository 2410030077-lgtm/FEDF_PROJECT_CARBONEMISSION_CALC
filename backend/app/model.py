def predict_carbon_footprint(electricity, fuel, waste):
    # Basic dummy formula (can be replaced with ML model later)
    carbon_electricity = electricity * 0.85
    carbon_fuel = fuel * 2.31
    carbon_waste = waste * 0.5
    total = carbon_electricity + carbon_fuel + carbon_waste
    return round(total, 2)
