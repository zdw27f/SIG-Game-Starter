# Setting up your environment
*__Note__: This is being done assuming you're using the C++ client with Vagrant/Virtualbox. Look below in the Original README for instructions on how to install Vagrant & Virtualbox.

1. Clone down this repo: https://github.com/zdw27f/SIG-Game-Starter
2. Change to the repo's folder and run “vagrant up”
3. Then run “vagrant ssh” and navigate into the Cerveau folder.
4. Run “node ./main.js” to start the Game server.
5. Open up 2 new terminal tabs/windows and go back to the Joueur.cpp folder directory.
6. In one of the new terminals, enter the command "make"
7. In each of the two new terminals, you should then run the command “./run Saloon”. This will start two AI’s (in this case the same AI) and they will play against each other.

*__Note__: At this point, you should have one terminal running the game server, and two others each which ran an AI against each other.

8. After the game finishes, it will print out a link. Put this link in you web browser, and you should be able to see the game visually played out.

Note: When your done, make sure to close the game server by entering “Ctrl + C” and then type “exit” on one of the terminals (followed by an enter) and then enter “vagrant halt” to stop the vagrant box (virtual machine) from running. The next time you want the vagrant box (virtual machine) back up and running, enter “vagrant reload —provision”.

# Original README below

# GAME_NAME C++ Client

This is the root of your AI. Stay out of the `joueur/` folder, it does most of the heavy lifting to play on our game servers. Your AI, and the game objects it manipulates are all in `games/game_name/`, with your very own AI living in `games/game_name/ai.hpp` and `games/game_name/ai.cpp` files for you to make smarter.

## How to Run

This client has been tested and confirmed to work on the Campus rc##xcs213 Linux machines, but it can work on your own Windows/Linux/Mac machines if you desire.

Also make sure **NOT** to try to compile this in your Missouri S&T S-Drive. This is not a fault with the client, but rather the school's S-Drive implementation changing some file permissions during run time. We cannot control this. Instead, we recommend cloning your repo outside the S-Drive and use an SCP program like [WinSCP][winscp] to edit the files in Windows using whatever IDE you want if you want to code in Windows, but compile in Linux.

### Linux

    make
    ./testRun MyOwnGameSession

Linux does not have any dependencies beyond a C++ compiler and build system. You will need `make` and `cmake` to build, and `gcc` for compiling.

### Windows

There are two ways to get this client working on Windows.

#### Visual Studio

1. You will need to install a recent version of [Visual Studio][vs] with VC++.
2. Add VC++ to the command line by running `vcvarsall.bat`. By default this is found at `C:\Program Files (x86)\Microsoft Visual Studio 14.0\VC\vcvarsall.bat`.
3. Install [CMake][cmake] for Windows, and during installation have it added to your PATH.
4. If you make a make system, you can now just run `make` to build the project, or...
5. If you want to work **in** Visual Studio run the script `make_vs_proj.bat`, then, in the newly created `build/` directory use that `sln` file generated.

You'll also need to use the following command line arguments when running the client to connect to our game server:

`GAME_NAME -s r99acm.device.mst.edu`

#### MinGW

MinGW is another solution on Windows if you do not wish to use Visual Studio or VC++ compilers, and instead would prefer a compiler like GCC (but then why are you not on Linux?).

1. Install [MinGw][mingw]
2. Have the MinGW Installation Manager, and install the base, make, and gcc packages.
3. Ensure the `MinGW/bin/` directory is added to your PATH so you can use the packages from the command line
4. Install [CMake][cmake]
5. Compile this client by navigating to where you cloned this repo and running `make` or `ming32-make`.

Notes: You may have to set the `cc` environmental variable to the C++ compiler of your choice (gcc.exe probably)


### Vagrant

Install [Vagrant][vagrant] and [Virtualbox][virtualbox] in order to use the Vagrant configuration we provide which satisfies all build dependencies inside of a virtual machine. This will allow for development with your favorite IDE or editor on your host machine while being able to run the client inside the virtual machine. Vagrant will automatically sync the changes you make into the virtual machine that it creates. In order to use vagrant **after installing the aforementioned requirements** simply run from the root of this client:

```bash
vagrant up
```

and after the build has completed you can ssh into the virtual environment by running:

```bash
vagrant ssh
```

From there you will be in a Linux environment that has all the dependencies you'll need to build and run this client.

When the competition is over, or the virtual environment becomes corrupted in some way, simply execute `vagrant destroy` to delete the virtual machine and its contents.

For a more in depth guide on using vagrant, take a look at [their guide][vagrant-guide]

#### Windows

Using Vagrant with Windows can be a bit of a pain. Here are some tips:

* Use an OpenSSH compatible ssh client. We recommend [Git Bash][gitbash] to serve double duty as your git client and ssh client
* Launch the terminal of your choice (like Git Bash) as an Administrator to ensure the symbolic links can be created when spinning up your Vagrant virtual machine

## Other notes

Always use the `->` operator to access member variables and functions of each class instead of the dot operator `.`.

The only file you should ever modify to create your AI are the `ai.cpp` and `ai.hpp` files. All the other files are needed for the game to work. In addition, you should never be creating your own instances of the Game's classes, nor should you ever try to modify their variables. Instead, treat the Game and its members as a read only structure that represents the game state on the game server. You interact with it by calling the game functions.

Most importantly, **stay out of the impl/ directories**.

[vs]: https://www.visualstudio.com/downloads/
[cmake]: http://cmake.org/
[mingw]: http://www.mingw.org/
[winscp]: https://winscp.net/eng/download.php
[vagrant]: https://www.vagrantup.com/downloads.html
[virtualbox]: https://www.virtualbox.org/wiki/Downloads
[vagrant-guide]: https://www.vagrantup.com/docs/getting-started/up.html
[virtualbox]: https://www.virtualbox.org/wiki/Downloads
[gitbash]: https://git-scm.com/downloads
