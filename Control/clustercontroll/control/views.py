from django.shortcuts import render

# Create your views here.
# control/views.py
import subprocess
from django.http import JsonResponse
from django.views import View
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name='dispatch')
class StartMachineView(View):
    def post(self, request):
        # Parse the incoming JSON data
        data = json.loads(request.body)
        vm_name = data.get("vm_name")

        if not vm_name:
            return JsonResponse({"status": "error", "message": "VM name is required"}, status=400)
        
        start_script = f'''
        tell application "UTM"
            set vm to virtual machine named "{vm_name}"
            start vm    
        end tell
        '''
        
        process = subprocess.Popen(['osascript', '-e', start_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, error = process.communicate()
        
        if error:
            return JsonResponse({"status": "error", "message": error.decode()}, status=500)
        else:
            return JsonResponse({"status": "success", "message": "VM started successfully"})

@method_decorator(csrf_exempt, name='dispatch')
class StopMachineView(View):
    def post(self, request):
        data = json.loads(request.body)
        vm_name = data.get("vm_name")
        stop_type = data.get("stop_type", "stop")  # Choose stop type, default to "stop"

        if not vm_name:
            return JsonResponse({"status": "error", "message": "VM name is required"}, status=400)

        # Define the AppleScript directly with the chosen stop type
        stop_script = f'''
        tell application "UTM"
            set vm to virtual machine named "{vm_name}"
            {stop_type} vm
        end tell
        '''

        process = subprocess.Popen(['osascript', '-e', stop_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, error = process.communicate()

        if error:
            return JsonResponse({"status": "error", "message": error.decode()}, status=500)
        else:
            return JsonResponse({"status": "success", "message": f"VM stopped with {stop_type} successfully"})