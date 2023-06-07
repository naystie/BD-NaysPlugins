/**
 * @name NoAFK
 * @author Naystie
 * @authorId 344871509677965313
 * @version 0.0.3
 * @description Stops Discord from setting your presence to idle.
 * @website https://naystie.com
 * @source https://github.com/Naystie/BD-NaysPlugins
 * @updateUrl https://raw.githubusercontent.com/Naystie/BD-NaysPlugins/main/NoAFK.plugin.js
 */

module.exports = (() => {
  const config = {
    info: {
      name: "NoAFK",
      authors: [
        {
          name: "Naystie",
          discord_id: "344871509677965313",
          github_username: "Naystie",
        },
      ],
      version: "0.0.3",
      description:
        "Stops Discord from setting your presence to idle. ",
      github: "https://github.com/Naystie/BD-NaysPlugins",
      github_raw:
        "https://raw.githubusercontent.com/Naystie/BD-NaysPlugins/main/NoAFK.plugin.js",
    },
    main: "NoAFK.plugin.js",
  };
  const RequiredLibs = [{
    window: "ZeresPluginLibrary",
    filename: "0PluginLibrary.plugin.js",
    external: "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js",
    downloadUrl: "https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js"
  },
  ];
  class handleMissingLibrarys {
    load() {
      for (const Lib of RequiredLibs.filter(lib => !window.hasOwnProperty(lib.window)))
        BdApi.showConfirmationModal(
          "Library Missing",
          `The library plugin (${Lib.window}) needed for ${config.info.name} is missing. Please click Download Now to install it.`,
          {
            confirmText: "Download Now",
            cancelText: "Cancel",
            onConfirm: () => this.downloadLib(Lib),
          }
        );
    }
    async downloadLib(Lib) {
      const fs = require("fs");
      const path = require("path");
      const { Plugins } = BdApi;
      const LibFetch = await fetch(
        Lib.downloadUrl
      );
      if (!LibFetch.ok) return this.errorDownloadLib(Lib);
      const LibContent = await LibFetch.text();
      try {
        await fs.writeFile(
          path.join(Plugins.folder, Lib.filename),
          LibContent,
          (err) => {
            if (err) return this.errorDownloadLib(Lib);
          }
        );
      } catch (err) {
        return this.errorDownloadLib(Lib);
      }
    }
    errorDownloadZLib(Lib) {
      const { shell } = require("electron");
      BdApi.showConfirmationModal(
        "Error Downloading",
        [
          `${Lib.window} download failed. Manually install plugin library from the link below.`,
        ],
        {
          confirmText: "Download",
          cancelText: "Cancel",
          onConfirm: () => {
            shell.openExternal(
              Lib.external
            );
          },
        }
      );
    }
    start() { }
    stop() { }
  }
  return RequiredLibs.some(m => !window.hasOwnProperty(m.window))
    ? handleMissingLibrarys
    : (([Plugin, ZLibrary]) => {
      const {
        Utilities,
        Logger,
        PluginUpdater,
        Patcher,
        Settings: { SettingPanel, Switch, },
        DiscordModules: {
          CurrentUserIdle,
          UserStore,
          ElectronModule,
        },
      } = ZLibrary;   
      const defaultSettings = {
        noAFK: true,
      };
      return class NoAFK extends Plugin {
        constructor() {
          super();
          this.settings = Utilities.loadData(
            config.info.name,
            "settings",
            defaultSettings
          );
        }
        checkForUpdates() {
          try {
            PluginUpdater.checkForUpdate(
              config.info.name,
              config.info.version,
              config.info.github_raw
            );
          } catch (err) {
            Logger.err("Plugin Updater could not be reached.", err);
          }
        }
        onStart() {
          this.checkForUpdates();
          this.initialize();
        }
        initialize() {
          if (this.settings["noAFK"]) this.noIdle();      
        }
        noIdle() {
          Patcher.instead(CurrentUserIdle, "getIdleSince", () => null);
          Patcher.instead(CurrentUserIdle, "isIdle", () => false);
          Patcher.instead(CurrentUserIdle, "isAFK", () => false);
        }
        onStop() {
        }
        getSettingsPanel() {
          return SettingPanel.build(
            this.saveSettings.bind(this),
            new Switch(
              "No AFK",
              this.settings["noAFK"],
              (e) => {
                this.settings["noAFK"] = e;
              }
            )
          );
        }
        saveSettings() {
          Utilities.saveData(config.info.name, "settings", this.settings);
          this.stop();
          this.initialize();
        }
      };
    })(ZLibrary.buildPlugin(config));
})();
