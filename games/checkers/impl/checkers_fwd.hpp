// DO NOT MODIFY THIS FILE
// Never try to directly create an instance of this class, or modify its member variables.
// This contains implementation details, written by code, and only useful to code

#ifndef GAMES_CHECKERS_FWD_H
#define GAMES_CHECKERS_FWD_H

//include declarations for all of the internal classes in the game's namespace
#include <memory>

namespace cpp_client
{

namespace checkers
{


class Checker_;
using Checker = std::shared_ptr<Checker_>;

class Game_object_;
using Game_object = std::shared_ptr<Game_object_>;

class Player_;
using Player = std::shared_ptr<Player_>;

class Game_;
using Game = Game_*;

}

}

#endif // GAMES_CHECKERS_H
