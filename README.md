# CompGrid

General steps to configured boosted VMs for ssh connection:

1. Login
2. Install and startup openssh
3. create new user and password
4. check local ip address
5. in remote machine, do ```ssh [user]@[ip address]```

Debian:

Log in with username ```debian``` and password ```debian```

```
sudo adduser --gecos "Full Name,RoomNumber,WorkPhone,HomePhone" --disabled-password newusername && echo "newusername:newpassword" | sudo chpasswd
sudo apt install openssh-server
sudo systemctl start ssh
ip -4 a show enp0s1 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
```

ArchLinux:

Log in with username ```root``` and password ```root```

```
useradd -m -s /bin/bash newusername && echo "newusername:password" | chpasswd
pacman -Syu --noconfirm
systemctl start sshd
ip -4 a show enp0s1 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'
```
