import subprocess
from enum import Enum
import uuid

class Machine:
    def __init__(self, name:str, id:str):
        self.name = name
        self.value = id

class MachineType(Enum):
    ArchLinux = "2F2C4095-EC5B-49CD-A654-FE17D7EC7CAA"
    Debian = "4F14A631-5B4E-464D-AEBA-B263D4BFA952"

class Cluster:
    def __init__(self):
        self.machines = set()
        self.machines.add(Machine("ArchLinux", "2F2C4095-EC5B-49CD-A654-FE17D7EC7CAA"))
        self.machines.add(Machine("Debian 11 (Xfce)", "4F14A631-5B4E-464D-AEBA-B263D4BFA952"))

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
            new_machine = Machine(new_machine_name, new_machine_id)
            self.machines.add(new_machine)
            print(f"{new_machine.name} created")
            return new_machine

# Instantiate an object of MyClass
my_cluster = Cluster()
machines = my_cluster.get_machines_IDs()
print(machines)
my_cluster.create_machine(MachineType.Debian)