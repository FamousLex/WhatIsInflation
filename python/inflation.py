from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import pandas as pd
import numpy as np
import json

app = Flask(__name__)
CORS(app)

CACHE_FILE = "cached_data.json"

API_KEY = "e86f94c1b21c42ed9184c61aaa84323b"

@app.route('/calculate_inflation', methods=['POST'])
def calculate_inflation():
    params = request.json
    series_id = params.get('series_id', 'CUUR0000SA0')
    start_year = params.get('start_year', '2014')
    end_year = params.get('end_year', '2024')
    
    # Fetch CPI data from BLS API
    headers = {'Content-type': 'application/json'}
    data = {
        "seriesid": [series_id],
        "startyear": start_year,
        "endyear": end_year,
        "registrationkey": API_KEY
    }
    response = requests.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', json=data, headers=headers)
    results = response.json()
    
    # Log the response to inspect the structure
    # print("API Response:", results)

    # Check if 'Results' and 'series' keys are in the response
    if 'Results' in results and 'series' in results['Results']:
        series = results['Results']['series'][0]['data']
        df = pd.DataFrame(series)
        df['value'] = df['value'].astype(float)
        # print(df['value'].shift(1) - df['value'])
        print(df['value'].shift(1))
        print(df['value'])
        # print(df['value'].shift(12) - df['value'])
        # print(df['value'].shift(-12))
        # print(df['value'])
        df['inflation_rate_monthly'] = ((df['value'] - df['value'].shift(-1)) / df['value'].shift(-1)) * 100
        df['inflation_rate_yearly'] = ((df['value'] - df['value'].shift(-12)) / df['value'].shift(-12)) * 100
        df = df.replace({np.nan: None})  # Replace NaN with None for JSON compatibility
        data_to_cache = df.to_dict(orient='records')
        
        # Save the result to cache
        with open(CACHE_FILE, 'w') as f:
            json.dump(data_to_cache, f)
        
        return jsonify(data_to_cache)
    else:
        return jsonify({"error": "Data not available or API limit reached"}), 500
if __name__ == '__main__':
    app.run(debug=True)



##############################################

# def calculate_inflation(params):
#     series_id = params.get('series_id', 'CUUR0000SA0')  # Default to all items CPI
#     start_year = params.get('start_year', '2014')
#     end_year = params.get('end_year', '2024')
    
#     # Fetch CPI data from BLS API
#     headers = {'Content-type': 'application/json'}
#     data = {
#         "seriesid": [series_id],
#         "startyear": start_year,
#         "endyear": end_year
#     }
#     response = requests.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', json=data, headers=headers)
#     results = response.json()
#     print(results)

#     # Process data
#     series = results['Results']['series'][0]['data']
#     df = pd.DataFrame(series)
#     df['value'] = df['value'].astype(float)
#     df['inflation_rate'] = df['value'].pct_change() * 100  # Monthly inflation rate

#     # Return processed data
#     return df.to_dict(orient='records')

# test_params = {
#     "series_id": "CUUR0000SA0",
#     "start_year": "2014",
#     "end_year": "2024"
# }

# result = calculate_inflation(test_params)
# print(result)
