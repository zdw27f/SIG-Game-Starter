// DO NOT MODIFY THIS FILE
// Never try to directly create an instance of this class, or modify its member variables.
// This contains implementation details, written by code, and only useful to code

#include "../warehouse.hpp"
#include "../../../joueur/src/base_ai.hpp"
#include "../../../joueur/src/any.hpp"
#include "../../../joueur/src/exceptions.hpp"
#include "../../../joueur/src/delta.hpp"
#include "../building.hpp"
#include "../fire_department.hpp"
#include "../forecast.hpp"
#include "../game_object.hpp"
#include "../player.hpp"
#include "../police_department.hpp"
#include "../warehouse.hpp"
#include "../weather_station.hpp"
#include "anarchy.hpp"

#include <type_traits>

namespace cpp_client
{

namespace anarchy
{

int Warehouse_::ignite(const Building& building)
{
    std::string order = R"({"event": "run", "data": {"functionName": "ignite", "caller": {"id": ")";
    order += this->id + R"("}, "args": {)";

    order += std::string("\"building\":") + "{\"id\":" + building->id + "}";

    order += "}}}";
    Anarchy::instance()->send(order);
    //Go until not a delta
    std::unique_ptr<Any> info;
    //until a not bool is seen (i.e., the delta has been processed)
    do
    {
        info = std::move(Anarchy::instance()->handle_response());
    } while(info->type() == typeid(bool));
    auto& val = info->as<rapidjson::Document*>()->FindMember("data")->value;
    Any to_return;
    morph_any(to_return, val);
    return to_return.as<int>();
}


Warehouse_::Warehouse_(std::initializer_list<std::pair<std::string, Any&&>> init) :
    Building_{
        {"exposure", Any{std::decay<decltype(exposure)>::type{}}},
        {"fireAdded", Any{std::decay<decltype(fire_added)>::type{}}},
    },
    exposure(variables_["exposure"].as<std::decay<decltype(exposure)>::type>()),
    fire_added(variables_["fireAdded"].as<std::decay<decltype(fire_added)>::type>())
{
    for(auto&& obj : init)
    {
      variables_.emplace(std::make_pair(std::move(obj.first), std::move(obj.second)));
    }
}

Warehouse_::~Warehouse_() = default;

void Warehouse_::resize(const std::string& name, std::size_t size)
{
    try
    {
        Building_::resize(name, size);
        return;
    }
    catch(...){}
    throw Bad_manipulation(name + " in Warehouse treated as a vector, but it is not a vector.");
}

void Warehouse_::change_vec_values(const std::string& name, std::vector<std::pair<std::size_t, Any>>& values)
{
    try
    {
        Building_::change_vec_values(name, values);
        return;
    }
    catch(...){}
    throw Bad_manipulation(name + " in Warehouse treated as a vector, but it is not a vector.");
}

void Warehouse_::remove_key(const std::string& name, Any& key)
{
    try
    {
        Building_::remove_key(name, key);
        return;
    }
    catch(...){}
    throw Bad_manipulation(name + " in Warehouse treated as a map, but it is not a map.");
}

std::unique_ptr<Any> Warehouse_::add_key_value(const std::string& name, Any& key, Any& value)
{
    try
    {
        return Building_::add_key_value(name, key, value);
    }
    catch(...){}
    throw Bad_manipulation(name + " in Warehouse treated as a map, but it is not a map.");
}

bool Warehouse_::is_map(const std::string& name)
{
    return false;
}

void Warehouse_::rebind_by_name(Any* to_change, const std::string& member, std::shared_ptr<Base_object> ref)
{
   throw Bad_manipulation(member + " in Warehouse treated as a reference, but it is not a reference.");
}


} // anarchy

} // cpp_client
