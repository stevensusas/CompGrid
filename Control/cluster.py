# app.py
from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route('/start-machine', methods=['POST'])
def start_machine():
    data = request.get_json()
    vm_name = data.get("vm_name")

    if not vm_name:
        return jsonify({"status": "error", "message": "VM name is required"}), 400

    start_script = f'''
    tell application "UTM"
        set vm to virtual machine named "{vm_name}"
        start vm    
    end tell
    '''
    
    process = subprocess.Popen(['osascript', '-e', start_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, error = process.communicate()
    
    if error:
        return jsonify({"status": "error", "message": error.decode()}), 500
    else:
        return jsonify({"status": "success", "message": "VM started successfully"})

@app.route('/stop-machine', methods=['POST'])
def stop_machine():
    data = request.get_json()
    vm_name = data.get("vm_name")
    stop_type = data.get("stop_type", "stop")

    if not vm_name:
        return jsonify({"status": "error", "message": "VM name is required"}), 400

    stop_script = f'''
    tell application "UTM"
        set vm to virtual machine named "{vm_name}"
        {stop_type} vm
    end tell
    '''

    process = subprocess.Popen(['osascript', '-e', stop_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, error = process.communicate()

    if error:
        return jsonify({"status": "error", "message": error.decode()}), 500
    else:
        return jsonify({"status": "success", "message": f"VM stopped with {stop_type} successfully"})

if __name__ == '__main__':
    app.run(port=5000)
