import subprocess
from enum import Enum
import uuid
import time
import re

class MachineType(Enum):
    ArchLinux = "2F2C4095-EC5B-49CD-A654-FE17D7EC7CAA"
    Debian = "4F14A631-5B4E-464D-AEBA-B263D4BFA952"

class Machine:
    def __init__(self, name:str, id:str, type: MachineType, ip: str = None):
        self.name = name
        self.value = id
        self.type = type
        if ip:
            self.ip = ip

    def get_all_ip(self):
        try:
            # Run command and get output
            cmd = "arp -a | grep '192.168.64'"
            output = subprocess.check_output(cmd, shell=True, text=True)
            
            # Use regex to extract IPs (patterns between parentheses)
            ip_pattern = r'\(([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)\)'
            ip_addresses = re.findall(ip_pattern, output)
            
            return ip_addresses

        except subprocess.CalledProcessError:
            return []
        
    def start_machine(self):
        previous_ips = self.get_all_ip()
        previous_ips.append('192.168.64.1')
        start_script = f'''
    tell application "UTM"
        set vm to virtual machine named "{self.name}"
        start vm    
    end tell
    '''
        process = subprocess.Popen(['osascript', '-e', start_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, error = process.communicate()
        if error:
            print("Error:", error.decode())
            return False
        else:
            time.sleep(20)
            new_ips = self.get_all_ip()
            self.ip = list(set(new_ips) - set(previous_ips))[0]
            print(f"{self.name} started")
            print(f"{self.ip} is machine's IP")
            return True

class Cluster:
    def __init__(self):
        self.machines = set()
        self.machines.add(Machine("ArchLinux", "2F2C4095-EC5B-49CD-A654-FE17D7EC7CAA", MachineType.ArchLinux, '192.168.64.7'))
        self.machines.add(Machine("Debian 11 (Xfce)", "4F14A631-5B4E-464D-AEBA-B263D4BFA952", MachineType.Debian, '192.168.64.8'))

    def get_machines(self):
        return self.machines

    def get_machines_IDs(self):
        ListVMs = """
        tell application "UTM"
            --- listing virtual machines
            set vms to virtual machines
        end tell
        """
        process = subprocess.Popen(['osascript', '-e', ListVMs], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, error = process.communicate()
        
        # Initialize an empty list to store VM IDs
        vm_ids = []

        if output:
            decoded_output = output.decode().strip()
            
            # Assuming the output format is consistent, extract VM IDs
            # Split by ', ' and filter parts that contain 'virtual machine id'
            parts = decoded_output.split(", ")
            for part in parts:
                if "virtual machine id" in part:
                    # Extract the VM ID by splitting the string and taking the last element
                    vm_id = part.split(" ")[-1]
                    vm_ids.append(vm_id)

        if error:
            print("Error:", error.decode())

        # Return the list of VM IDs
        return vm_ids

    def create_machine(self, machineType: MachineType):
        previous_machines = self.get_machines()
        new_machine_name = f"{machineType.name} {str(uuid.uuid4())}"
        duplicate_command = f"""
        tell application "UTM"
            set vm to virtual machine id "{machineType.value}"
            duplicate vm with properties {{configuration:{{name:"{new_machine_name}", hypervisor:false}}}}
        end tell
        """

        process = subprocess.Popen(['osascript', '-e', duplicate_command], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, error = process.communicate()

        if error:
            print("Error:", error.decode())
            return None
        else:
            new_machines = self.get_machines()
            new_machine_id = list(set(new_machines) - set(previous_machines))
            new_machine = Machine(new_machine_name, new_machine_id, machineType)
            self.machines.add(new_machine)
            print(f"{new_machine.name} created")
            return new_machine

# Instantiate an object of MyClass
my_cluster = Cluster()
machines = my_cluster.get_machines_IDs()
duplicate = my_cluster.create_machine(MachineType.ArchLinux)
duplicate.start_machine()