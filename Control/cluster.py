# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import traceback

app = Flask(__name__)
CORS(app)


@app.route("/start-machine", methods=["POST"])
def start_machine():
    try:
        data = request.get_json()
        vm_name = data.get("vm_name")

        print(f"Attempting to start VM: {vm_name}")

        if not vm_name:
            return jsonify({"status": "error", "message": "VM name is required"}), 400

        start_script = f"""
        tell application "UTM"
            set vm to virtual machine named "{vm_name}"
            start vm
        end tell
        """

        print(f"Executing AppleScript: {start_script}")

        process = subprocess.Popen(
            ["osascript", "-e", start_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        output, error = process.communicate()

        print(f"Process return code: {process.returncode}")
        print(f"Process output: {output}")
        print(f"Process error: {error}")

        if process.returncode != 0 or error:
            error_message = error or "Unknown error occurred"
            print(f"Error starting VM: {error_message}")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": error_message,
                        "details": {
                            "returncode": process.returncode,
                            "output": output,
                            "error": error,
                        },
                    }
                ),
                500,
            )

        return jsonify(
            {
                "status": "success",
                "message": "VM started successfully",
                "details": {"output": output},
            }
        )

    except Exception as e:
        print(f"Exception in start_machine:")
        print(traceback.format_exc())
        return (
            jsonify(
                {
                    "status": "error",
                    "message": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


@app.route("/stop-machine", methods=["POST"])
def stop_machine():
    try:
        data = request.get_json()
        vm_name = data.get("vm_name")

        print(f"Attempting to stop VM: {vm_name}")

        if not vm_name:
            return jsonify({"status": "error", "message": "VM name is required"}), 400

        stop_script = f"""
        tell application "UTM"
            set vm to virtual machine named "{vm_name}"
            suspend vm
        end tell
        """

        print(f"Executing AppleScript: {stop_script}")

        process = subprocess.Popen(
            ["osascript", "-e", stop_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        output, error = process.communicate()

        print(f"Process return code: {process.returncode}")
        print(f"Process output: {output}")
        print(f"Process error: {error}")

        if process.returncode != 0 or error:
            error_message = error or "Unknown error occurred"
            print(f"Error stopping VM: {error_message}")
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": error_message,
                        "details": {
                            "returncode": process.returncode,
                            "output": output,
                            "error": error,
                        },
                    }
                ),
                500,
            )

        return jsonify(
            {
                "status": "success",
                "message": "VM stopped successfully",
                "details": {"output": output},
            }
        )

    except Exception as e:
        print(f"Exception in stop_machine:")
        print(traceback.format_exc())
        return (
            jsonify(
                {
                    "status": "error",
                    "message": str(e),
                    "traceback": traceback.format_exc(),
                }
            ),
            500,
        )


if __name__ == "__main__":
    app.run(port=5000, debug=True)
