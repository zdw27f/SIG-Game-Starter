# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|

  config.vm.box = "ubuntu/xenial64"

  client_name = File.basename(__dir__)

  config.vm.define client_name do |t|
  end

  # Create a private network, which allows host-only access to the machine
  # using a specific IP.
  config.vm.network "forwarded_port", guest: 3080, host: 3080, host_ip: "127.0.0.1"
  config.vm.network "private_network", type: "dhcp"

  config.vm.synced_folder ".", "/vagrant", disabled: true
  config.vm.synced_folder ".", "/home/ubuntu/#{client_name}"
  config.vm.provision "shell", privileged: false, inline: <<-SHELL
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get update
    sudo apt-get upgrade -y
    sudo apt-get install -y libboost-all-dev cmake g++ nodejs

    cd SIG-Game-Starter/Cerveau/
    npm install
  SHELL
end
