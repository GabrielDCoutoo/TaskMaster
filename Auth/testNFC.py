from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/nfc', methods=['POST'])
def receive_nfc():
    data = request.get_json()
    
    if "nfc_data" in data:
        nfc_value = data["nfc_data"]
        print(f"Received NFC Data: {nfc_value}")
        return jsonify({"message": "NFC data received successfully!"}), 200

    return jsonify({"error": "No NFC data provided"}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
