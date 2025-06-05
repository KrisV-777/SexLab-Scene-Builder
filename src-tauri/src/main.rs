#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod project;
mod furniture;
mod racekeys;
mod cli;

use project::{position::Position, package::Package, scene::Scene, stage::Stage, NanoID};
use log::{error, info};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
};
use tauri::{
    menu::{CheckMenuItem, Menu, MenuBuilder, MenuItem, SubmenuBuilder}, AppHandle, Emitter, Listener, Manager, Runtime, WebviewWindowBuilder, Wry
};
use tauri_plugin_cli::CliExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

const DEFAULT_MAINWINDOW_TITLE: &str = "SexLab Scene Builder";

pub static PROJECT: Lazy<Mutex<Package>> = Lazy::new(|| {
    let prjct = Package::new();
    Mutex::new(prjct)
});

static EDITED: AtomicBool = AtomicBool::new(false);
#[inline]
fn set_edited(val: bool) -> () {
    EDITED.store(val, Ordering::Relaxed)
}
#[inline]
fn get_edited() -> bool {
    EDITED.load(Ordering::Relaxed)
}

static IS_DARKMODE: AtomicBool = AtomicBool::new(false);
#[inline]
fn set_darkmode(val: bool) -> () {
    IS_DARKMODE.store(val, Ordering::Relaxed)
}
#[inline]
fn get_darkmode() -> bool {
    IS_DARKMODE.load(Ordering::Relaxed)
}

fn setup_logger() -> Result<(), fern::InitError> {
    fern::Dispatch::new()
        .format(|out, message, record| out.finish(format_args!("[{}] {}", record.level(), message)))
        .level(log::LevelFilter::Info)
        .chain(std::io::stdout())
        .chain(fern::log_file("SceneBuilder.log")?)
        .apply()?;
    Ok(())
}

/// MAIN

const MAIN_WINDOW: &str = "main_window";

const NEW_PROJECT: &str = "new_prjct";
const OPEN_PROJECT: &str = "open_prjct";
const DARKMODE: &str = "darkmode";

fn main() {
    setup_logger().expect("Unable to initialize logger");
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_cli::init())
        .invoke_handler(tauri::generate_handler![
            request_project_update,
            get_race_keys,
            create_blank_scene,
            save_scene,
            delete_scene,
            open_stage_editor,
            open_stage_editor_from,
            stage_save_and_close,
            make_position,
            mark_as_edited,
            get_in_darkmode
        ])
        .setup(|app| {
            let matches = app.cli().matches()?;
            if let Some(command) = matches.subcommand {
                let res = match command.name.as_str() {
                    "convert" => cli::convert(command.matches.args),
                    "build" => cli::build(command.matches.args),
                    _ => Err(format!("Unrecognized subcommand: {}", command.name)),
                }.map_err(|e| {
                    error!("Error while processing CLI command: {}", e);
                    Box::<dyn std::error::Error>::from(e)
                });
                app.handle().exit(res.is_err() as i32);
                return res;
            }

            let window = WebviewWindowBuilder::new(
                app.app_handle(),
                MAIN_WINDOW.to_string(),
                tauri::WebviewUrl::App("./index.html".into()),
            )
            .title(DEFAULT_MAINWINDOW_TITLE)
            .menu(get_menu(&app.app_handle()).expect("Failed to create menu"))
            .build()
            .expect("Failed to create main window");
            let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                width: 1024,
                height: 768,
            }));
            let _ = window.set_min_size(Some(tauri::Size::Physical(tauri::PhysicalSize {
                width: 800,
                height: 600,
            })));

            app.on_menu_event(menu_event_listener);
            
            let app_handle = app.app_handle().clone();
            window.on_window_event(move |event| window_event_listener(&app_handle, event));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn reload_project(reload_type: &str, window: &tauri::WebviewWindow) {
    let mut prjct = PROJECT.lock().unwrap();
    let result = match reload_type {
        NEW_PROJECT => {
            prjct.reset();
            Ok(())
        }
        OPEN_PROJECT => prjct.load_project(window.app_handle()),
        _ => Err(format!("Invalid reload type: {}", reload_type)),
    };
    if let Err(e) = result {
        error!("{}", e);
        return;
    }
    if prjct.pack_name == String::default() {
        let _ = window.set_title(DEFAULT_MAINWINDOW_TITLE);
    } else {
        let _ = window
            .set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
    }
    window.emit("on_project_update", &prjct.scenes).unwrap();
}

fn get_menu(app: &AppHandle) -> Result<Menu<Wry>, Box<dyn std::error::Error>> {
    let file_menu = SubmenuBuilder::new(app, "File")
        .items(&[
            &MenuItem::with_id(app, NEW_PROJECT, "New Project", true, "cmdOrControl+N".into())?,
            &MenuItem::with_id(app, OPEN_PROJECT, "Open Project", true, "cmdOrControl+O".into())?
        ])
        .separator()
        .items(&[
            &MenuItem::with_id(app, "import_offset", "Import Offset.yaml", true, Option::<&str>::None)?,
            &MenuItem::with_id(app, "save", "Save", true, "cmdOrControl+S".into())?,
            &MenuItem::with_id(app, "save_as", "Save As...", true, "cmdOrControl+Shift+S".into())?,
            &MenuItem::with_id(app, "build", "Export", true, "cmdOrControl+B".into())?
        ])
        .separator()
        .quit()
        .build()?;
    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&CheckMenuItem::with_id(app, DARKMODE, "Dark Mode", true, get_darkmode(), Option::<&str>::None)?)
        .build()?;
    let help_menu = SubmenuBuilder::new(app, "Help")
        .text("open_docs", "Open Wiki")
        .separator()
        .text("discord", "Discord")
        .text("patreon", "Patreon")
        .text("kofi", "Ko-Fi")
        .build()?;
    let top_menu = MenuBuilder::new(app)
        .items(&[
            &file_menu,
            &view_menu,
            &help_menu,
        ])
        .build()?;
    Ok(top_menu)
}

fn menu_event_listener(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().0.as_str() {
        NEW_PROJECT | OPEN_PROJECT => {
            let event_id = event.id().0.clone();
            let window = app.get_webview_window(MAIN_WINDOW).unwrap();
            if get_edited() {
                app.dialog()
                    .message("There are unsaved changes. Loading a new project will cause these changes to be lost.\nContinue?")
                    .title(if event_id == NEW_PROJECT {"New Project"} else {"Open Project"})
                    .buttons(MessageDialogButtons::YesNo)
                    .kind(MessageDialogKind::Warning)
                    .show(move |result| match result {
                        true => reload_project(&event_id, &window),
                        false => info!("User cancelled the project reload.")
                    });
                return;
            }
            reload_project(&event_id, &window);
        }
        "save" | "save_as" => {
            let mut prjct = PROJECT.lock().unwrap();
            if let Err(err) = prjct.save_project(event.id().0 == "save_as", app) {
                error!("Failed to save project: {}", err);
                return;
            }
            set_edited(false);
            let window = app.get_webview_window(MAIN_WINDOW).unwrap();
            let _ = window.set_title(format!("{} - {}", DEFAULT_MAINWINDOW_TITLE, prjct.pack_name).as_str());
        }
        "build" => {
            let prjct = PROJECT.lock().unwrap();
            if let Err(err) = prjct.export(app) {
                error!("Failed to build project: {}", err);
            }
        }
        DARKMODE => {
            let in_darkmode = get_darkmode();
            if let Err(err) = app.emit("toggle_darkmode", !in_darkmode) {
                error!("Unable to toggle darkmode, event failure: {}", err);
            } else {
                set_darkmode(!in_darkmode);
            }
        }
        "open_docs" => {
            let _ = app.opener().open_url("https://github.com/Scrabx3/SexLab/wiki/Scene-Builder", Option::<String>::None);
        }
        "discord" => {
            let _ = app.opener().open_url("https://discord.gg/JPSHb4ebqj", Option::<String>::None);
        }
        "patreon" => {
            let _ = app.opener().open_url("https://www.patreon.com/ScrabJoseline", Option::<String>::None);
        }
        "kofi" => {
            let _ = app.opener().open_url("https://ko-fi.com/scrab", Option::<String>::None);
        }
        "import_offset" => {
            let mut prjct = PROJECT.lock().unwrap();
            if let Err(err) = prjct.import_offset(app) {
                error!("{}", err);
            }
        }
        _ => {error!("Unrecognized command: {}", event.id().0)}
    }
}

fn window_event_listener(app: &AppHandle, event: &tauri::WindowEvent) {
    match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            if get_edited() {
                let do_close = app.dialog()
                    .message("There are unsaved changes. Are you sure you want to close?")
                    .title("Close")
                    .buttons(MessageDialogButtons::YesNo)
                    .kind(MessageDialogKind::Warning)
                    .blocking_show();
                if !do_close {
                    api.prevent_close();
                    return;
                }
            }
            std::process::exit(0);
        }
        _ => {}
    }
}

/// COMMANDS

#[tauri::command]
async fn request_project_update<R: Runtime>(window: tauri::Window<R>) -> () {
    let prjct = PROJECT.lock().unwrap();
    window.emit("on_project_update", &prjct.scenes).unwrap();
}

#[tauri::command]
async fn get_race_keys() -> Vec<String> {
    racekeys::get_race_keys_string()
}

#[tauri::command]
async fn mark_as_edited<R: Runtime>(window: tauri::Window<R>) -> () {
    set_edited(true);
    if let Ok(title) = window.title() {
        if !title.ends_with('*') {
            window.set_title(format!("{}*", title).as_str()).unwrap();
        }
    }
}

#[tauri::command]
fn get_in_darkmode() -> bool {
    get_darkmode()
}

/* Scene */

#[tauri::command]
fn create_blank_scene() -> Scene {
    Scene::default()
}

#[tauri::command]
async fn save_scene<R: Runtime>(window: tauri::Window<R>, scene: Scene) -> () {
    mark_as_edited(window).await;
    PROJECT.lock().unwrap().save_scene(scene);
}

#[tauri::command]
fn delete_scene<R: Runtime>(window: tauri::Window<R>, id: NanoID) -> Result<Scene, String> {
    let ret = PROJECT.lock().unwrap().discard_scene(&id).ok_or_else(|| {
        let msg = format!("Invalid Scene ID: {}", id.0);
        error!("{}", msg);
        msg
    });

    if ret.is_ok() {
        set_edited(true);
        if let Ok(title) = window.title() {
            if !title.ends_with('*') {
                window.set_title(format!("{}*", title).as_str()).unwrap();
            }
        }
    }

    ret
}

/* Stage */

#[derive(Debug, Serialize, Deserialize, Clone)]
struct EditorPayload {
    pub stage: Stage,
    pub control: Option<Stage>,
}

fn open_stage_editor_impl<R: Runtime>(app: &tauri::AppHandle<R>, payload: EditorPayload) {
    let ref stage = payload.stage;
    info!("Opening Stage {}", stage.id.0);
    let window = WebviewWindowBuilder::new(
        app,
        format!("stage_editor_{}", stage.id.0),
        tauri::WebviewUrl::App("./stage.html".into()),
    )
    .title(if stage.name.is_empty() {
        "Stage Editor [Untitled]".into()
    } else {
        format!("Stage Editor [{}]", stage.name.as_str())
    })
    .min_inner_size(800.0, 600.0)
    .build()
    .unwrap();
    let _ = window.set_size(tauri::Size::Physical(tauri::PhysicalSize {
        width: 1024,
        height: 768,
    }));
    let _ = window.set_resizable(true);
    window.clone().listen("on_request_data", move |_| {
        window.emit("on_data_received", payload.clone()).unwrap();
    });
}

#[tauri::command]
async fn open_stage_editor<R: Runtime>(
    app: tauri::AppHandle<R>,
    stage: Option<Stage>,
    control: Option<Stage>,
) -> () {
    let stage = stage.unwrap_or(Stage::from_count(
        control
            .as_ref()
            .and_then(|stage| Some(stage.positions.len()))
            .unwrap_or(1),
    ));
    open_stage_editor_impl(&app, EditorPayload { stage, control });
}

#[tauri::command]
async fn open_stage_editor_from<R: Runtime>(app: tauri::AppHandle<R>, control: Stage) -> () {
    let mut stage = Stage::from_count(control.positions.len());
    stage.tags = control.tags.clone();
    let payload = EditorPayload {
        stage,
        control: Some(control),
    };
    open_stage_editor_impl(&app, payload);
}

#[tauri::command]
async fn stage_save_and_close<R: Runtime>(
    app: tauri::AppHandle<R>,
    window: tauri::Window<R>,
    stage: Stage,
) -> () {
    // IDEA: make give this event some unique id to allow
    // front end distinguish the timings at which some stage editor has been opened
    info!("Saving Stage {}", stage.id.0);
    app.emit_to(MAIN_WINDOW, "on_stage_saved", stage).unwrap();
    let _ = window.close();
}

/* Position related */

#[tauri::command]
fn make_position() -> Position {
    Position::default()
}
