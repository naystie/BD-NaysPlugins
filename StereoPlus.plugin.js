/**
 * @name StereoSound
 * @version 0.0.8
 * @author naystie
 * @authorLink https://github.com/naystie
 * @source https://raw.githubusercontent.com/naystie/bd-addons/main/plugins/StereoSound.plugin.js
 */

/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\\BetterDiscord\\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {
        "main": "index.js",
        "info": {
            "name": "StereoSound",
            "authors": [{
                "name": "naystie",
                "discord_id": "147077474222604288",
                "github_username": "naystie"
            }],
            "authorLink": "https://github.com/naystie",
            "version": "0.0.8",
            "description": "Adds stereo sound to your own microphone's output. Requires a capable stereo microphone.",
            "github": "https://github.com/naystie/bd-addons",
            "github_raw": "https://raw.githubusercontent.com/naystie/bd-addons/main/plugins/StereoSound.plugin.js"
        },
        "changelog": [{
            "title": "Changes",
            "items": ["Added stereo toggle setting", "Removed toast notifications", "Replaced author names"]
        }],
        "defaultConfig": [{
            "type": "switch",
            "id": "enableStereo",
            "name": "Enable Stereo",
            "note": "Enable or disable stereo sound output",
            "value": true
        }, {
            "type": "dropdown",
            "id": "quality",
            "name": "Audio Quality",
            "note": "Select the audio quality for your stereo sound",
            "value": "512000",
            "options": [{
                "label": "Low (64 kbps)",
                "value": "64000"
            }, {
                "label": "Medium (128 kbps)",
                "value": "128000"
            }, {
                "label": "High (256 kbps)",
                "value": "256000"
            }, {
                "label": "Very High (512 kbps)",
                "value": "512000"
            }]
        }]
    };

    return !global.ZeresPluginLibrary ? class {
        constructor() {
            this._config = config;
        }
        getName() {
            return config.info.name;
        }
        getAuthor() {
            return config.info.authors.map(a => a.name).join(", ");
        }
        getDescription() {
            return config.info.description;
        }
        getVersion() {
            return config.info.version;
        }
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {
            const {
                WebpackModules,
                Patcher
            } = Library;

            return class StereoSound extends Plugin {
                onStart() {
                    this.settingsWarning();
                    const voiceModule = WebpackModules.getByPrototypes("updateVideoQuality");
                    Patcher.after(voiceModule.prototype, "updateVideoQuality", this.replacement.bind(this));
                }

                settingsWarning() {
                    const voiceSettingsStore = WebpackModules.getByProps("getEchoCancellation");
                    if (
                        voiceSettingsStore.getNoiseSuppression() ||
                        voiceSettingsStore.getNoiseCancellation() ||
                        voiceSettingsStore.getEchoCancellation()
                    ) {
                        console.warn("Please disable echo cancellation, noise reduction, and noise suppression for StereoSound");
                        return true;
                    } else return false;
                }

                replacement(thisObj, _args, ret) {
                    const setTransportOptions = thisObj.conn.setTransportOptions;

                    thisObj.conn.setTransportOptions = (obj) => {
                        if (this.settings.enableStereo) {
                            if (obj.audioEncoder) {
                                obj.audioEncoder.params = {
                                    stereo: "2",
                                };
                                obj.audioEncoder.channels = 2;
                            }
                        }

                        const bitrate = parseInt(this.settings.quality);
                        if (obj.encodingVoiceBitRate < bitrate) {
                            obj.encodingVoiceBitRate = bitrate;
                        }

                        if (obj.fec) {
                            obj.fec = false;
                        }

                        setTransportOptions.call(thisObj, obj);
                    };

                    return ret;
                }

                onStop() {
                    Patcher.unpatchAll();
                }

                getSettingsPanel() {
                    const panel = this.buildSettingsPanel();
                    return panel.getElement();
                }
            };
        };
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();

/*@end@*/

