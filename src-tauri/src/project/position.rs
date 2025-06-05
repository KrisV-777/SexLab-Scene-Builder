use serde::{Deserialize, Serialize};

use super::serialize::{EncodeBinary, deserialize_vec_or_string};
use crate::project::{define::{Offset, Sex, Stripping}, position_info::PositionInfo};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    #[serde(deserialize_with = "deserialize_vec_or_string")]
    pub event: Vec<String>,
    pub anim_obj: String,
    pub offset: Offset,
    pub strip_data: Stripping,
    #[serde(default)]   // addition 2.0
    pub climax: bool,
    #[serde(default)]   // addition 2.0
    pub tags: Vec<String>,

    // Unused fields, but kept for compatibility
    #[serde(skip_serializing, default)]
    pub schlong: i8,
    #[serde(skip_serializing, default)]
    pub extra: Extra,
    #[serde(skip_serializing, default)]
    pub sex: Sex,
    #[serde(skip_serializing, default)]
    pub race: String,
    #[serde(skip_serializing, default)]
    pub scale: f32,
}

impl Position {
    pub fn import_offset(&mut self, yaml_obj: &serde_yaml::Mapping) -> Result<(), String> {
        let loc = yaml_obj[&"Location".into()]
            .as_sequence()
            .ok_or("Location is not a sequence")?
            .iter()
            .filter_map(|it| it.as_f64()).collect::<Vec<_>>();
        if loc.len() != 3 {
            return Err(format!(
                "Invalid location vector, expected length 3 but got {}",
                loc.len()
            ));
        }
        let rot = yaml_obj[&"Rotation".into()]
            .as_f64()
            .ok_or("Rotation is not a float")?;

        self.offset.x = loc[0] as f32;
        self.offset.y = loc[1] as f32;
        self.offset.z = loc[2] as f32;
        self.offset.r = rot as f32;

        Ok(())
    }

    pub fn update_to_latest_version(&mut self, old_version: u8) -> Result<(), String> {
        if old_version <= 3 {
            self.climax = self.extra.climax;
            self.tags = self.extra.custom.clone();
        }
        Ok(())
    }

    pub fn extract_position_info(&self) -> PositionInfo {
        PositionInfo {
            sex: self.sex.clone(),
            race: self.race.clone(),
            scale: self.scale,
            submissive: self.extra.submissive,
            vampire: self.extra.vampire,
            dead: self.extra.dead,
        }
    }
}

impl EncodeBinary for Position {
    fn get_byte_size(&self) -> usize {
        assert!(!self.event.is_empty(), "Event list should not be empty");
        self.event.first().map_or(0, |e| e.get_byte_size()) +
            self.climax.get_byte_size() +
            self.offset.get_byte_size() +
            self.strip_data.get_byte_size() +
            self.tags.get_byte_size()
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        // Only save initial event, all others are called by Havok
        assert!(!self.event.is_empty(), "Event list should not be empty");
        self.event.first().unwrap().write_byte(buf);
        self.climax.write_byte(buf);
        self.offset.write_byte(buf);
        self.strip_data.write_byte(buf);
        self.tags.write_byte(buf);
    }
}

impl Default for Position {
    fn default() -> Self {
        Self {
            sex: Default::default(),
            race: "Human".into(),
            event: Default::default(),
            climax: false,
            scale: 1.0,
            extra: Default::default(),
            offset: Default::default(),
            anim_obj: Default::default(),
            strip_data: Default::default(),
            schlong: Default::default(),
            tags: Default::default(),
        }
    }
}


#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    pub submissive: bool,
    pub vampire: bool,
    pub climax: bool,
    pub dead: bool,

    #[serde(default)]
    pub custom: Vec<String>,

    // Unused fields, but kept for compatibility
    #[serde(skip_serializing, default)]
    pub handshackles: bool,
    #[serde(skip_serializing, default)]
    pub yoke: bool,
    #[serde(skip_serializing, default)]
    pub armbinder: bool,
    #[serde(skip_serializing, default)]
    pub legbinder: bool,
    #[serde(skip_serializing, default)]
    pub petsuit: bool,
    #[serde(skip_serializing, default)]
    pub optional: bool,
}
