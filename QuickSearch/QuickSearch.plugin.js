/**
 * @name QuickSearch
 * @author Naystie
 * @authorId 344871509677965313
 * @version 0.0.1
 * @description Adds a Google Search to the Message Options Bar
 * @website https://naystie.com/
 * @source https://github.com/Naystie/BD-QuickSearch
 * @updateUrl https://raw.githubusercontent.com/Naystie/BD-QuickSearch/main/QuickSearch.plugin.js
 */

module.exports = (_ => {
	const changeLog = {
		
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		constructor (meta) {for (let key in meta) this[key] = meta[key];}
		getName () {return this.name;}
		getAuthor () {return this.author;}
		getVersion () {return this.version;}
		getDescription () {return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		return class QuickSearch extends Plugin {
			onLoad () {
				this.modulePatches = {
					after: [
						"MessageToolbar"
					]
				};
			}
			
			onStart () {}
			
			onStop () {}
		
			processMessageToolbar(e) {
    if ((BDFDB.UserUtils.can("SEND_MESSAGES") || e.instance.props.channel && (e.instance.props.channel.isDM() || e.instance.props.channel.isGroupDM()))) {
        let isOwnMessage = e.instance.props.message.author.id === BDFDB.UserUtils.me.id;
        let isBotMessage = e.instance.props.message.author.bot;
        if (!isBotMessage && !isOwnMessage) {
            e.returnvalue.props.children.splice(1, 0, BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TooltipContainer, {
                    key: "google",
                    text: "Search",
                    children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Clickable, {
                      className: BDFDB.disCN.messagetoolbarbutton,
                      onClick: () => {
                        let messageText = e.instance.props.message.content;
                        let searchText = encodeURIComponent(messageText);
                        window.open(`https://www.google.com/search?q=${searchText}`);
                      },
                      children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SvgIcon, {
                        className: BDFDB.disCN.messagetoolbaricon,
                        name: BDFDB.LibraryComponents.SvgIcon.Names.SEARCH
                      })
                    })
                  }));
                }
            }
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
