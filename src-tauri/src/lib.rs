#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager, WindowEvent,
};

#[cfg(desktop)]
use tauri_plugin_autostart::MacosLauncher;

fn has_background_launch_flag<I, S>(args: I) -> bool
where
    I: IntoIterator<Item = S>,
    S: AsRef<str>,
{
    args.into_iter().any(|arg| arg.as_ref() == "--background")
}

#[tauri::command]
fn is_background_launch() -> bool {
    has_background_launch_flag(std::env::args())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let background_launch = is_background_launch();

    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--background"]),
        ))
        .invoke_handler(tauri::generate_handler![is_background_launch])
        .setup(move |app| {
            if let Some(window) = app.get_webview_window("main") {
                if background_launch {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            let show = MenuItemBuilder::with_id("show", "打开起身一下").build(app)?;
            let break_now = MenuItemBuilder::with_id("break-now", "现在休息").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "退出应用").build(app)?;
            let menu = MenuBuilder::new(app)
                .items(&[&show, &break_now, &quit])
                .build()?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .tooltip("起身一下 · 桌面宠物");
            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }
            tray_builder
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "break-now" => {
                        let _ = app.emit("tray-start-break", ());
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running break-pet");
}

#[cfg(test)]
mod tests {
    use super::has_background_launch_flag;

    #[test]
    fn recognizes_background_launch_flag() {
        assert!(has_background_launch_flag(["break-pet", "--background"]));
        assert!(!has_background_launch_flag(["break-pet"]));
    }
}
