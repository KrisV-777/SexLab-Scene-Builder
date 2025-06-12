use serde::{Deserialize, Serialize};
use std::vec;

use crate::project::scene::Scene;

use super::{position::Position, serialize::EncodeBinary, NanoID};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Stage {
    pub id: NanoID,
    pub name: String,

    pub positions: Vec<Position>,
    pub tags: Vec<String>,
    pub extra: Extra,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Extra {
    pub fixed_len: f32,
    pub nav_text: String,
}

impl Stage {
    pub fn new(parent_scene: &Scene) -> Self {
        let stage = parent_scene.stages.last();
        Self {
            id: NanoID::new_nanoid(),
            name: Default::default(),
            positions: stage.map_or_else(
                || vec![Position::new(None); parent_scene.positions.len()],
                |s| s.positions.iter().map(|p| Position::new(Some(p))).collect(),
            ),
            tags: parent_scene.tags.clone(),
            extra: Default::default(),
        }
    }

    pub fn import_offset(&mut self, yaml_obj: &serde_yaml::Sequence) -> Result<(), String> {
        let list: Vec<_> = yaml_obj
            .iter()
            .map_while(|obj| {
                obj.as_mapping().and_then(|mapping| {
                    mapping
                        .get(&"transform".into())
                        .and_then(|obj| obj.as_mapping())
                })
            })
            .collect();
        if list.len() != self.positions.len() {
            return Err(format!(
                "Invalid position length, got {} but exepcted {}",
                list.len(),
                self.positions.len(),
            ));
        }
        for (i, pos_obj) in list.iter().enumerate() {
            self.positions[i].import_offset(*pos_obj)?;
        }

        Ok(())
    }

    pub fn update_to_latest_version(&mut self, old_version: u8) -> Result<(), String> {
        for pos in &mut self.positions {
            pos.update_to_latest_version(old_version)?;
        }
        Ok(())
    }
}

impl EncodeBinary for Stage {
    fn get_byte_size(&self) -> usize {
        self.id.get_byte_size()
            + self.positions.get_byte_size()
            + self.extra.fixed_len.get_byte_size()
            + self.extra.nav_text.get_byte_size()
            + self.tags.get_byte_size()
    }

    fn write_byte(&self, buf: &mut Vec<u8>) -> () {
        self.id.write_byte(buf);
        self.positions.write_byte(buf);
        self.extra.fixed_len.write_byte(buf);
        self.extra.nav_text.write_byte(buf);
        self.tags
            .iter()
            .map(|tag| {
                tag.chars()
                    .filter(|c| !c.is_whitespace())
                    .collect::<String>()
                    .to_lowercase()
            })
            .collect::<Vec<_>>()
            .write_byte(buf);
    }
}

impl PartialEq for Stage {
    fn eq(&self, other: &Self) -> bool {
        self.id == other.id
    }
}
