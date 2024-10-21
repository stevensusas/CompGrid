# CompGrid

General steps to configured boosted VMs for ssh connection:

1. Install and startup openssh
2. create new user and password
3. check local ip address
4. in remote machine, do ```ssh [user]@[ip address]```

Debian:

Log in with username ```debian``` and password ```debian```

```
sudo adduser --gecos "Full Name,RoomNumber,WorkPhone,HomePhone" --disabled-password newusername && echo "newusername:newpassword" | sudo chpasswd
sudo apt install openssh-server
sudo systemctl start ssh

ip a
```
