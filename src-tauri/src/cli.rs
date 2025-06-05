use std::path::PathBuf;
use crate::project::package::Package;

pub fn convert(
  args: std::collections::HashMap<String, tauri_plugin_cli::ArgData>,
) -> Result<(), String> {
  let in_path = match &args.get("in").unwrap().value {
      serde_json::Value::String(value) => PathBuf::from(value),
      _ => return Err("input slal file not provided".to_string()),
  };
  if !in_path.exists() || !in_path.is_file() || in_path.extension().unwrap() != "json" {
      return Err("input slal file is invalid".to_string());
  }

  let mut out_path = match &args.get("out").unwrap().value {
      serde_json::Value::String(value) => PathBuf::from(value),
      _ => return Err("output dir not provided".to_string()),
  };
  if !out_path.exists() || !out_path.is_dir() {
      return Err("output dir is invalid".to_string());
  }

  out_path.push(in_path.file_stem().unwrap());
  out_path.set_extension("slsb.json");
  println!("Converting {} to {}", in_path.display(), out_path.display());

  let mut project = Package::from_slal(in_path)?;
  project.write(out_path.clone())
}

pub fn build(
  args: std::collections::HashMap<String, tauri_plugin_cli::ArgData>,
) -> Result<(), String> {
  let in_path = match &args.get("in").unwrap().value {
      serde_json::Value::String(value) => PathBuf::from(value),
      _ => return Err("input slal file not provided".to_string()),
  };
  if !in_path.exists() || !in_path.is_file() || in_path.extension().unwrap() != "json" {
      return Err("input slal file is invalid".to_string());
  }

  let out_dir = match &args.get("out").unwrap().value {
      serde_json::Value::String(value) => PathBuf::from(value),
      _ => return Err("output dir not provided".to_string()),
  };
  if !out_dir.exists() || !out_dir.is_dir() {
      return Err("output dir is invalid".to_string());
  }

  let file = std::fs::File::open(&in_path).map_err(|e| e.to_string())?;
  let project = Package::from_file(file)?;
  project.build(out_dir).map_err(|e| e.to_string())
}
