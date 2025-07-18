use std::collections::HashMap;

#[derive(Debug, Clone, Copy)]
pub enum RaceKey {
    Human = 0,
    AshHopper,
    Bear,
    Boar,
    BoarMounted,
    BoarSingle,
    Canine,
    Chaurus,
    ChaurusHunter,
    ChaurusReaper,
    Chicken,
    Cow,
    Deer,
    Dog,
    Dragon,
    DragonPriest,
    Draugr,
    DwarvenBallista,
    DwarvenCenturion,
    DwarvenSphere,
    DwarvenSpider,
    Falmer,
    FlameAtronach,
    Fox,
    FrostAtronach,
    Gargoyle,
    Giant,
    GiantSpider,
    Goat,
    Hagraven,
    Hare,
    Horker,
    Horse,
    IceWraith,
    LargeSpider,
    Lurker,
    Mammoth,
    Mudcrab,
    Netch,
    Riekling,
    Sabrecat,
    Seeker,
    Skeever,
    Slaughterfish,
    Spider,
    Spriggan,
    StormAtronach,
    Troll,
    VampireLord,
    Werewolf,
    Wisp,
    Wispmother,
    Wolf,
}

pub fn map_legacy_to_racekey(legacykey: &str) -> Result<String, String> {
    let key = legacykey.to_lowercase();
    match key.as_str() {
        "humans" => Ok("Human".into()),
        "ashhoppers" => Ok("Ash Hopper".into()),
        "bears" => Ok("Bear".into()),
        "boarsany" => Ok("Boar".into()),
        "boarsmounted" => Ok("Boar (Any)".into()),
        "boars" => Ok("Boar (Mounted)".into()),
        "canines" => Ok("Canine".into()),
        "chaurus" => Ok("Chaurus".into()),
        "chaurushunters" => Ok("Chaurus Hunter".into()),
        "chaurusreapers" => Ok("Chaurus Reaper".into()),
        "chickens" => Ok("Chicken".into()),
        "cows" => Ok("Cow".into()),
        "deers" => Ok("Deer".into()),
        "dogs" => Ok("Dog".into()),
        "dragons" => Ok("Dragon".into()),
        "dragonpriests" => Ok("Dragon Priest".into()),
        "draugrs" => Ok("Draugr".into()),
        "dwarvenballistas" => Ok("Dwarven Ballista".into()),
        "dwarvencenturions" => Ok("Dwarven Centurion".into()),
        "dwarvenspheres" => Ok("Dwarven Sphere".into()),
        "dwarvenspiders" => Ok("Dwarven Spider".into()),
        "falmers" => Ok("Falmer".into()),
        "flameatronach" => Ok("Flame Atronach".into()),
        "foxes" => Ok("Fox".into()),
        "frostatronach" => Ok("Frost Atronach".into()),
        "gargoyles" => Ok("Gargoyle".into()),
        "giants" => Ok("Giant".into()),
        "giantspiders" => Ok("Giant Spider".into()),
        "goats" => Ok("Goat".into()),
        "hagravens" => Ok("Hagraven".into()),
        "rabbits" => Ok("Rabbit".into()),
        "horkers" => Ok("Horker".into()),
        "horses" => Ok("Horse".into()),
        "icewraiths" => Ok("Ice Wraith".into()),
        "largespiders" => Ok("Large Spider".into()),
        "lurkers" => Ok("Lurker".into()),
        "mammoths" => Ok("Mammoth".into()),
        "mudcrabs" => Ok("Mudcrab".into()),
        "netches" => Ok("Netch".into()),
        "rieklings" => Ok("Riekling".into()),
        "sabrecats" => Ok("Sabrecat".into()),
        "seekers" => Ok("Seeker".into()),
        "skeevers" => Ok("Skeever".into()),
        "slaughterfishes" => Ok("Slaughterfish".into()),
        "spiders" => Ok("Spider".into()),
        "spriggans" => Ok("Spriggan".into()),
        "stormatronach" => Ok("Storm Atronach".into()),
        "trolls" => Ok("Troll".into()),
        "vampirelords" => Ok("Vampire Lord".into()),
        "werewolves" => Ok("Werewolf".into()),
        "wisps" => Ok("Wisp".into()),
        "wispmothers" => Ok("Wispmother".into()),
        "wolves" => Ok("Wolf".into()),
        _ => Err(format!("Unrecognized legacy key: {}", legacykey).into()),
    }
}

fn get_race_map() -> HashMap<String, RaceKey> {
    HashMap::from([
        ("Human".into(), RaceKey::Human),
        ("Ash Hopper".into(), RaceKey::AshHopper),
        ("Bear".into(), RaceKey::Bear),
        ("Boar".into(), RaceKey::BoarSingle),
        ("Boar (Any)".into(), RaceKey::Boar),
        ("Boar (Mounted)".into(), RaceKey::BoarMounted),
        ("Canine".into(), RaceKey::Canine),
        ("Chaurus".into(), RaceKey::Chaurus),
        ("Chaurus Hunter".into(), RaceKey::ChaurusHunter),
        ("Chaurus Reaper".into(), RaceKey::ChaurusReaper),
        ("Chicken".into(), RaceKey::Chicken),
        ("Cow".into(), RaceKey::Cow),
        ("Deer".into(), RaceKey::Deer),
        ("Dog".into(), RaceKey::Dog),
        ("Dragon Priest".into(), RaceKey::DragonPriest),
        ("Dragon".into(), RaceKey::Dragon),
        ("Draugr".into(), RaceKey::Draugr),
        ("Dwarven Ballista".into(), RaceKey::DwarvenBallista),
        ("Dwarven Centurion".into(), RaceKey::DwarvenCenturion),
        ("Dwarven Sphere".into(), RaceKey::DwarvenSphere),
        ("Dwarven Spider".into(), RaceKey::DwarvenSpider),
        ("Falmer".into(), RaceKey::Falmer),
        ("Flame Atronach".into(), RaceKey::FlameAtronach),
        ("Fox".into(), RaceKey::Fox),
        ("Frost Atronach".into(), RaceKey::FrostAtronach),
        ("Gargoyle".into(), RaceKey::Gargoyle),
        ("Giant".into(), RaceKey::Giant),
        ("Goat".into(), RaceKey::Goat),
        ("Hagraven".into(), RaceKey::Hagraven),
        ("Horker".into(), RaceKey::Horker),
        ("Horse".into(), RaceKey::Horse),
        ("Ice Wraith".into(), RaceKey::IceWraith),
        ("Lurker".into(), RaceKey::Lurker),
        ("Mammoth".into(), RaceKey::Mammoth),
        ("Mudcrab".into(), RaceKey::Mudcrab),
        ("Netch".into(), RaceKey::Netch),
        ("Rabbit".into(), RaceKey::Hare),
        ("Riekling".into(), RaceKey::Riekling),
        ("Sabrecat".into(), RaceKey::Sabrecat),
        ("Seeker".into(), RaceKey::Seeker),
        ("Skeever".into(), RaceKey::Skeever),
        ("Slaughterfish".into(), RaceKey::Slaughterfish),
        ("Storm Atronach".into(), RaceKey::StormAtronach),
        ("Spider".into(), RaceKey::Spider),
        ("Large Spider".into(), RaceKey::LargeSpider),
        ("Giant Spider".into(), RaceKey::GiantSpider),
        ("Spriggan".into(), RaceKey::Spriggan),
        ("Troll".into(), RaceKey::Troll),
        ("Vampire Lord".into(), RaceKey::VampireLord),
        ("Werewolf".into(), RaceKey::Werewolf),
        ("Wispmother".into(), RaceKey::Wispmother),
        ("Wisp".into(), RaceKey::Wisp),
        ("Wolf".into(), RaceKey::Wolf),
    ])
}

pub fn get_race_keys_string() -> Vec<String> {
    get_race_map()
        .iter()
        .map(|(key, _)| key.clone())
        .collect()
}

pub fn get_race_key_bytes(race: &str) -> Option<u8> {
    get_race_map()
        .get(race)
        .map(|&key| key as u8)
}
