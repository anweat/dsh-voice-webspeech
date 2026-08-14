window.__ModuleLoader__.load({
	id: "dsh-voice-webspeech",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/webspeech.ts
		function isWebSpeechSupported() {
			return typeof window !== "undefined" && (window.webkitSpeechRecognition !== void 0 || window.SpeechRecognition !== void 0);
		}
		function createWebSpeechRecognizer(lang, hooks) {
			const ctor = typeof window !== "undefined" ? window.SpeechRecognition ?? window.webkitSpeechRecognition : void 0;
			if (ctor === void 0) {
				let phase = "idle";
				return {
					get phase() {
						return phase;
					},
					start() {
						phase = "idle";
						hooks.onError?.({
							code: "unsupported",
							message: "This browser does not support the Web Speech API"
						});
						hooks.onEnd?.();
					},
					stop() {},
					abort() {
						phase = "idle";
					},
					dispose() {
						phase = "idle";
					}
				};
			}
			let phase = "idle";
			let recognition;
			let finalText = "";
			let aborting = false;
			const onEnd = () => {
				if (phase === "idle") return;
				phase = "idle";
				hooks.onEnd?.();
			};
			const ensure = () => {
				if (recognition === void 0) {
					recognition = new ctor();
					recognition.lang = lang;
					recognition.continuous = false;
					recognition.interimResults = true;
					recognition.maxAlternatives = 1;
					recognition.onstart = () => {
						hooks.onStart?.();
					};
					recognition.onresult = (event) => {
						let interim = "";
						for (let i = event.resultIndex; i < event.results.length; i += 1) {
							const result = event.results[i];
							if (result === void 0) continue;
							const transcript = result[0]?.transcript ?? "";
							if (result.isFinal) {
								if (transcript !== "") finalText += transcript;
							} else interim += transcript;
						}
						if (interim !== "") hooks.onInterim?.(interim);
					};
					recognition.onerror = (event) => {
						if (event.error === "aborted" || event.error === "no-speech") return;
						hooks.onError?.({
							code: event.error,
							message: event.message
						});
					};
					recognition.onend = () => {
						recognition = void 0;
						if (aborting) {
							aborting = false;
							finalText = "";
							onEnd();
							return;
						}
						const text = finalText;
						finalText = "";
						hooks.onResult?.(text);
						onEnd();
					};
				}
				return recognition;
			};
			return {
				get phase() {
					return phase;
				},
				start() {
					if (phase === "recording") return;
					finalText = "";
					aborting = false;
					phase = "recording";
					try {
						ensure().start();
					} catch {
						phase = "idle";
						hooks.onError?.({
							code: "audio-capture",
							message: "Failed to start recognition"
						});
						hooks.onEnd?.();
					}
				},
				stop() {
					if (phase !== "recording") return;
					phase = "stopping";
					try {
						recognition?.stop();
					} catch {
						onEnd();
					}
				},
				abort() {
					if (phase === "idle") return;
					phase = "idle";
					aborting = true;
					try {
						recognition?.abort();
					} catch {
						aborting = false;
						onEnd();
					}
				},
				dispose() {
					if (recognition !== void 0) {
						recognition.onstart = null;
						recognition.onresult = null;
						recognition.onerror = null;
						recognition.onend = null;
						try {
							if (phase !== "idle") recognition.abort();
						} catch {}
						recognition = void 0;
					}
					phase = "idle";
				}
			};
		}
		//#endregion
		//#region src/client/prefs.ts
		const DEFAULT_PREFS = {
			lang: "zh-CN",
			mode: "toggle",
			autoSend: false,
			append: true,
			showInterim: true
		};
		const PREFS_KEY = "dsh-voice-webspeech.prefs";
		function mergePrefs(raw) {
			const input = raw ?? {};
			return {
				lang: typeof input.lang === "string" && input.lang !== "" ? input.lang : DEFAULT_PREFS.lang,
				mode: input.mode === "hold" ? "hold" : DEFAULT_PREFS.mode,
				autoSend: typeof input.autoSend === "boolean" ? input.autoSend : DEFAULT_PREFS.autoSend,
				append: typeof input.append === "boolean" ? input.append : DEFAULT_PREFS.append,
				showInterim: typeof input.showInterim === "boolean" ? input.showInterim : DEFAULT_PREFS.showInterim
			};
		}
		function storage() {
			try {
				return typeof window !== "undefined" ? window.localStorage : void 0;
			} catch {
				return;
			}
		}
		let current = (() => {
			const store = storage();
			if (store !== void 0) try {
				const raw = store.getItem(PREFS_KEY);
				if (raw !== null) return mergePrefs(JSON.parse(raw));
			} catch {}
			return { ...DEFAULT_PREFS };
		})();
		function loadPrefs() {
			return current;
		}
		function updatePrefs(patch) {
			const next = mergePrefs({
				...current,
				...patch
			});
			current = next;
			const store = storage();
			if (store !== void 0) try {
				store.setItem(PREFS_KEY, JSON.stringify(next));
			} catch {}
			notifyPrefsChanged();
			return next;
		}
		const listeners = /* @__PURE__ */ new Set();
		function subscribePrefs(callback) {
			listeners.add(callback);
			return () => {
				listeners.delete(callback);
			};
		}
		function notifyPrefsChanged() {
			for (const listener of [...listeners]) listener();
		}
		//#endregion
		//#region \0dsh-css:src/client/RecorderButton.module.css.mjs
		const css$1 = "._85mIGq_wrap{align-items:center;display:inline-flex;position:relative}._85mIGq_mic,._85mIGq_micActive{touch-action:none;-webkit-user-select:none;user-select:none;width:28px;height:28px;color:var(--ds-color-text-secondary,#8a8f98);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;transition:color .15s,background .15s;display:inline-flex;position:relative}._85mIGq_mic:hover{color:var(--ds-color-text-primary,#e8eaed);background:var(--ds-color-bg-hover,#ffffff14)}._85mIGq_micActive{color:#fff;background:var(--ds-color-danger,#e5484d);animation:1.2s ease-in-out infinite _85mIGq_pulse}._85mIGq_icon{width:16px;height:16px}._85mIGq_overlay,._85mIGq_overlayError{white-space:pre-wrap;word-break:break-word;z-index:30;background:var(--ds-color-bg-elevated,#2a2b30);min-width:120px;max-width:340px;color:var(--ds-color-text-primary,#e8eaed);pointer-events:none;border-radius:8px;padding:6px 10px;font-size:12px;line-height:1.4;position:absolute;bottom:calc(100% + 6px);left:50%;transform:translate(-50%);box-shadow:0 4px 16px #00000059}._85mIGq_overlayError{color:#ffb4b8;background:#3d1f21}@keyframes _85mIGq_pulse{0%,to{opacity:1}50%{opacity:.55}}";
		const tagId$1 = "dsh-voice-webspeech/RecorderButton.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-voice-webspeech";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var RecorderButton_module_css_default = {
			"overlay": "_85mIGq_overlay",
			"micActive": "_85mIGq_micActive",
			"pulse": "_85mIGq_pulse",
			"mic": "_85mIGq_mic",
			"overlayError": "_85mIGq_overlayError",
			"wrap": "_85mIGq_wrap",
			"icon": "_85mIGq_icon"
		};
		//#endregion
		//#region src/client/RecorderButton.tsx
		/** Fatal error codes: recognition cannot proceed (permission/capture/network). */
		function isFatal(code) {
			return code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture" || code === "network" || code === "unsupported";
		}
		function RecorderButton({ inputActions, input, t }) {
			const prefs = (0, react.useSyncExternalStore)(subscribePrefs, loadPrefs);
			const [recording, setRecording] = (0, react.useState)(false);
			const [overlay, setOverlay] = (0, react.useState)({
				kind: null,
				text: ""
			});
			const [supported] = (0, react.useState)(() => isWebSpeechSupported());
			const activeRef = (0, react.useRef)(false);
			const fatalRef = (0, react.useRef)(false);
			const accumulatedRef = (0, react.useRef)("");
			const recognizerRef = (0, react.useRef)(null);
			const errorTimerRef = (0, react.useRef)(null);
			const prefsRef = (0, react.useRef)(prefs);
			prefsRef.current = prefs;
			const inputActionsRef = (0, react.useRef)(inputActions);
			inputActionsRef.current = inputActions;
			const inputRef = (0, react.useRef)(input);
			inputRef.current = input;
			const tRef = (0, react.useRef)(t);
			tRef.current = t;
			(0, react.useEffect)(() => {
				const deliver = (text) => {
					const trimmed = text.trim();
					if (trimmed === "") return;
					const current = prefsRef.current;
					if (current.autoSend) {
						inputActionsRef.current.setDraft(trimmed);
						inputActionsRef.current.submit();
						return;
					}
					const existing = inputRef.current?.draft ?? "";
					if (current.append && existing.trim() !== "") inputActionsRef.current.setDraft(existing + " " + trimmed);
					else inputActionsRef.current.setDraft(trimmed);
				};
				const recognizer = createWebSpeechRecognizer(prefs.lang, {
					onStart: () => {
						setRecording(true);
						setOverlay({
							kind: "recording",
							text: tRef.current("listening")
						});
					},
					onInterim: (text) => {
						if (!prefsRef.current.showInterim) return;
						const base = tRef.current("listening");
						setOverlay({
							kind: "recording",
							text: text !== "" ? `${base} ${text}` : base
						});
					},
					onResult: (text) => {
						const part = text.trim();
						if (part === "") return;
						accumulatedRef.current = accumulatedRef.current === "" ? part : accumulatedRef.current + " " + part;
					},
					onError: (error) => {
						if (error.code === "no-speech" || error.code === "aborted") return;
						if (isFatal(error.code)) {
							fatalRef.current = true;
							setOverlay({
								kind: "error",
								text: messageOf(error.code, tRef.current)
							});
							if (errorTimerRef.current !== null) clearTimeout(errorTimerRef.current);
							errorTimerRef.current = setTimeout(() => {
								setOverlay({
									kind: null,
									text: ""
								});
								errorTimerRef.current = null;
							}, 4e3);
						}
					},
					onEnd: () => {
						if (fatalRef.current) {
							fatalRef.current = false;
							setRecording(false);
							return;
						}
						if (activeRef.current) {
							recognizer.start();
							return;
						}
						const text = accumulatedRef.current;
						accumulatedRef.current = "";
						setRecording(false);
						setOverlay({
							kind: null,
							text: ""
						});
						deliver(text);
					}
				});
				recognizerRef.current = recognizer;
				return () => {
					if (errorTimerRef.current !== null) clearTimeout(errorTimerRef.current);
					recognizer.dispose();
					recognizerRef.current = null;
				};
			}, [prefs.lang]);
			const startRecognition = () => {
				if (errorTimerRef.current !== null) {
					clearTimeout(errorTimerRef.current);
					errorTimerRef.current = null;
				}
				if (!supported) {
					setOverlay({
						kind: "error",
						text: t("unsupported")
					});
					errorTimerRef.current = setTimeout(() => {
						setOverlay({
							kind: null,
							text: ""
						});
						errorTimerRef.current = null;
					}, 4e3);
					return;
				}
				activeRef.current = true;
				fatalRef.current = false;
				accumulatedRef.current = "";
				setOverlay({
					kind: null,
					text: ""
				});
				recognizerRef.current?.start();
			};
			const stopRecognition = () => {
				activeRef.current = false;
				recognizerRef.current?.stop();
			};
			const handlePointerDown = (event) => {
				if (prefsRef.current.mode !== "hold") return;
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				if (!activeRef.current) startRecognition();
			};
			const handlePointerEnd = () => {
				if (prefsRef.current.mode !== "hold") return;
				if (activeRef.current) stopRecognition();
			};
			const handleClick = () => {
				if (prefsRef.current.mode !== "toggle") return;
				if (activeRef.current) stopRecognition();
				else startRecognition();
			};
			const title = supported ? prefs.mode === "hold" ? t("holdToTalk") : t("tapToTalk") : t("unsupported");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: RecorderButton_module_css_default.wrap,
				children: [overlay.kind !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: overlay.kind === "error" ? RecorderButton_module_css_default.overlayError : RecorderButton_module_css_default.overlay,
					role: overlay.kind === "error" ? "alert" : "status",
					children: overlay.text
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: recording ? RecorderButton_module_css_default.micActive : RecorderButton_module_css_default.mic,
					"aria-label": t("buttonLabel"),
					"aria-pressed": recording,
					title,
					onPointerDown: handlePointerDown,
					onPointerUp: handlePointerEnd,
					onPointerCancel: handlePointerEnd,
					onClick: handleClick,
					onContextMenu: (event) => {
						event.preventDefault();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						className: RecorderButton_module_css_default.icon,
						viewBox: "0 0 24 24",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							fill: "currentColor",
							d: "M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0H4a8 8 0 0 0 7 7.94V22h2v-2.06A8 8 0 0 0 20 12h-2Z"
						})
					})
				})]
			});
		}
		function messageOf(code, t) {
			switch (code) {
				case "unsupported": return t("unsupported");
				case "not-allowed":
				case "service-not-allowed": return t("notAllowed");
				case "network": return t("network");
				case "no-speech": return t("noSpeech");
				case "audio-capture": return t("audioCapture");
				default: return t("failure", { code });
			}
		}
		//#endregion
		//#region src/client/detect.ts
		function detectBrowserSpeech() {
			const win = typeof window !== "undefined" ? window : void 0;
			const standard = win?.SpeechRecognition;
			const webkit = win?.webkitSpeechRecognition;
			const ctor = standard ?? webkit;
			const ua = win?.navigator?.userAgent ?? "";
			let backend = "unknown";
			if (ctor !== void 0) {
				if (/Edg\//.test(ua)) backend = "Microsoft Azure (Edge)";
				else if (/Chrome\//.test(ua)) backend = "Google (Chrome/Chromium)";
				else backend = "Web Speech (unknown)";
			} else backend = "none";
			return {
				supported: ctor !== void 0,
				constructorName: standard !== void 0 ? "standard" : webkit !== void 0 ? "webkit" : "none",
				backend,
				userAgent: ua
			};
		}
		//#endregion
		//#region \0dsh-css:src/client/SettingsCard.module.css.mjs
		const css = ".U2V8VW_card{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:12px;list-style:none;transition:border-color .16s,background .16s}.U2V8VW_card:hover{border-color:var(--dsw-alias-label-dimmed)}.U2V8VW_cardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.U2V8VW_header{appearance:none;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.U2V8VW_header:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.U2V8VW_headText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.U2V8VW_name{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.U2V8VW_description{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.U2V8VW_chevron{color:var(--dsw-alias-label-tertiary);flex:none;transition:transform .16s}.U2V8VW_chevronOpen{transform:rotate(180deg)}.U2V8VW_body{border-top:1px solid var(--dsw-alias-border-l2);margin:0 16px;padding:4px 0 12px}.U2V8VW_field{flex-direction:column;gap:6px;padding:12px 0;display:flex}.U2V8VW_field+.U2V8VW_field{border-top:1px solid var(--dsw-alias-border-l2)}.U2V8VW_label{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}.U2V8VW_hint{color:var(--dsw-alias-label-tertiary);margin:0;font-size:12px;line-height:1.5}.U2V8VW_select{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);height:34px;font:inherit;color:var(--dsw-alias-label-primary);border-radius:8px;padding:0 12px;font-size:13px;line-height:1.5}.U2V8VW_select:focus-visible{border-color:var(--dsw-alias-brand-primary);outline:none}.U2V8VW_toggleRow{justify-content:space-between;align-items:flex-start;gap:12px;padding:12px 0;display:flex}.U2V8VW_toggleRow+.U2V8VW_toggleRow{border-top:1px solid var(--dsw-alias-border-l2)}.U2V8VW_toggleText{flex-direction:column;gap:4px;min-width:0;display:flex}.U2V8VW_toggle{width:16px;height:16px;accent-color:var(--dsw-alias-brand-primary);flex:none;margin-top:2px}";
		const tagId = "dsh-voice-webspeech/SettingsCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-voice-webspeech";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var SettingsCard_module_css_default = {
			"headText": "U2V8VW_headText",
			"header": "U2V8VW_header",
			"hint": "U2V8VW_hint",
			"label": "U2V8VW_label",
			"toggle": "U2V8VW_toggle",
			"description": "U2V8VW_description",
			"chevron": "U2V8VW_chevron",
			"toggleRow": "U2V8VW_toggleRow",
			"name": "U2V8VW_name",
			"chevronOpen": "U2V8VW_chevronOpen",
			"card": "U2V8VW_card",
			"toggleText": "U2V8VW_toggleText",
			"select": "U2V8VW_select",
			"field": "U2V8VW_field",
			"cardOpen": "U2V8VW_cardOpen",
			"body": "U2V8VW_body"
		};
		//#endregion
		//#region src/client/SettingsCard.tsx
		const LANG_OPTIONS = [
			{
				value: "zh-CN",
				label: "中文（普通话）"
			},
			{
				value: "zh-TW",
				label: "中文（繁體）"
			},
			{
				value: "zh-HK",
				label: "中文（粤语）"
			},
			{
				value: "en-US",
				label: "English (US)"
			},
			{
				value: "en-GB",
				label: "English (UK)"
			},
			{
				value: "ja-JP",
				label: "日本語"
			},
			{
				value: "ko-KR",
				label: "한국어"
			},
			{
				value: "fr-FR",
				label: "Français"
			},
			{
				value: "de-DE",
				label: "Deutsch"
			},
			{
				value: "es-ES",
				label: "Español"
			},
			{
				value: "ru-RU",
				label: "Русский"
			}
		];
		function SettingsCard({ t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const prefs = (0, react.useSyncExternalStore)(subscribePrefs, loadPrefs);
			const [info] = (0, react.useState)(() => detectBrowserSpeech());
			const set = (patch) => {
				updatePrefs(patch);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: open ? SettingsCard_module_css_default.card + " " + SettingsCard_module_css_default.cardOpen : SettingsCard_module_css_default.card,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: SettingsCard_module_css_default.header,
					"aria-expanded": open,
					onClick: () => {
						setOpen(!open);
					},
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
						className: SettingsCard_module_css_default.headText,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SettingsCard_module_css_default.name,
							children: t("settingsTitle")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: SettingsCard_module_css_default.description,
							children: t("settingsDesc")
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
						className: open ? SettingsCard_module_css_default.chevron + " " + SettingsCard_module_css_default.chevronOpen : SettingsCard_module_css_default.chevron,
						viewBox: "0 0 14 14",
						width: "14",
						height: "14",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
							d: "M3.5 5.5 7 9l3.5-3.5",
							fill: "none",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							strokeLinejoin: "round"
						})
					})]
				}), open && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: SettingsCard_module_css_default.body,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SettingsCard_module_css_default.field,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: SettingsCard_module_css_default.label,
								htmlFor: "voice-webspeech-mode",
								children: t("modeTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
								id: "voice-webspeech-mode",
								className: SettingsCard_module_css_default.select,
								value: prefs.mode,
								onChange: (event) => {
									set({ mode: event.currentTarget.value === "hold" ? "hold" : "toggle" });
								},
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "toggle",
									children: t("modeToggle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: "hold",
									children: t("modeHold")
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SettingsCard_module_css_default.field,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: SettingsCard_module_css_default.label,
								htmlFor: "voice-webspeech-lang",
								children: t("langTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("select", {
								id: "voice-webspeech-lang",
								className: SettingsCard_module_css_default.select,
								value: prefs.lang,
								onChange: (event) => {
									set({ lang: event.currentTarget.value });
								},
								children: LANG_OPTIONS.map((option) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
									value: option.value,
									children: option.label
								}, option.value))
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SettingsCard_module_css_default.toggleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsCard_module_css_default.toggleText,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.label,
									children: t("autoSendTitle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.hint,
									children: t("autoSendDesc")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: SettingsCard_module_css_default.toggle,
								checked: prefs.autoSend,
								onChange: (event) => {
									set({ autoSend: event.currentTarget.checked });
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SettingsCard_module_css_default.toggleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsCard_module_css_default.toggleText,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.label,
									children: t("appendTitle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.hint,
									children: t("appendDesc")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: SettingsCard_module_css_default.toggle,
								checked: prefs.append,
								onChange: (event) => {
									set({ append: event.currentTarget.checked });
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							className: SettingsCard_module_css_default.toggleRow,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: SettingsCard_module_css_default.toggleText,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.label,
									children: t("interimTitle")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.hint,
									children: t("interimDesc")
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								className: SettingsCard_module_css_default.toggle,
								checked: prefs.showInterim,
								onChange: (event) => {
									set({ showInterim: event.currentTarget.checked });
								}
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SettingsCard_module_css_default.field,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: SettingsCard_module_css_default.label,
									children: t("browserGroupTitle")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SettingsCard_module_css_default.hint,
									children: info.supported ? t("browserSupported") : t("browserUnsupported")
								}),
								info.supported && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: SettingsCard_module_css_default.hint,
									children: t("browserBackend", { backend: info.backend })
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: SettingsCard_module_css_default.field,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: SettingsCard_module_css_default.label,
								children: t("privacyTitle")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: SettingsCard_module_css_default.hint,
								children: t("privacyDesc")
							})]
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const zh = {
			buttonLabel: "语音输入",
			holdToTalk: "按住说话，松手转文字（浏览器内置语音识别）",
			tapToTalk: "点击开始/停止语音输入（浏览器内置语音识别）",
			unsupported: "此浏览器不支持语音识别（需 Edge 或 Chrome 内核）",
			notAllowed: "麦克风权限被拒绝，请在浏览器地址栏允许后重试",
			audioCapture: "麦克风启动失败",
			noSpeech: "没有检测到语音",
			network: "语音识别网络错误（Chrome 走 Google 语音，部分网络不可达，建议换 Edge 走微软 Azure 语音）",
			listening: "正在聆听…",
			finalizing: "识别完成",
			settingsTitle: "语音输入",
			settingsDesc: "浏览器内置语音识别（Edge=微软 Azure、Chrome=Google），点麦克风说话转文字",
			inputGroupTitle: "输入",
			langTitle: "识别语言",
			modeTitle: "交互方式",
			modeToggle: "点击切换（点一下开始，再点一下停止）",
			modeHold: "长按说话（按住识别，松手转文字）",
			autoSendTitle: "停止后自动发送",
			autoSendDesc: "开启：识别完成直接发送；关闭：转文字进输入框，可编辑后再发送",
			appendTitle: "追加到已有文字",
			appendDesc: "关闭：每次识别替换输入框内容；开启：在已有内容后追加（自动空格分隔）",
			interimTitle: "显示实时识别",
			interimDesc: "聆听时在麦克风上方实时显示识别中的文字",
			browserGroupTitle: "浏览器识别能力",
			browserSupported: "当前浏览器支持 Web Speech API",
			browserUnsupported: "当前浏览器不支持 Web Speech API（需 Edge / Chrome 内核）",
			browserBackend: "识别后端：{backend}",
			privacyTitle: "隐私说明",
			privacyDesc: "录音直接交给浏览器内置语音服务（Edge=微软 Azure、Chrome=Google），不经过任何 DSH 服务端，也不落盘。",
			failure: "识别失败：{code}"
		};
		const en = {
			buttonLabel: "Voice input",
			holdToTalk: "Hold to talk, release to transcribe (browser speech recognition)",
			tapToTalk: "Tap to start/stop voice input (browser speech recognition)",
			unsupported: "Voice recognition is not supported in this browser (use Edge or a Chromium browser)",
			notAllowed: "Microphone permission denied — allow it in the address bar and retry",
			audioCapture: "Failed to start the microphone",
			noSpeech: "No speech detected",
			network: "Speech recognition network error (Chrome uses Google speech — blocked on some networks; try Edge which uses Microsoft Azure)",
			listening: "Listening…",
			finalizing: "Finalizing",
			settingsTitle: "Voice Input",
			settingsDesc: "Browser built-in speech recognition (Edge=Microsoft Azure, Chrome=Google)",
			inputGroupTitle: "Input",
			langTitle: "Language",
			modeTitle: "Interaction",
			modeToggle: "Tap to toggle (tap to start, tap again to stop)",
			modeHold: "Hold to talk (hold to record, release to stop)",
			autoSendTitle: "Auto-send after stop",
			autoSendDesc: "On: send right after recognition; Off: transcribe into the composer for review",
			appendTitle: "Append to existing draft",
			appendDesc: "Off: replace the draft each time; On: append after the existing text",
			interimTitle: "Show live transcription",
			interimDesc: "Show interim text above the mic button while listening",
			browserGroupTitle: "Browser speech capability",
			browserSupported: "This browser supports the Web Speech API",
			browserUnsupported: "This browser does not support the Web Speech API (Edge / Chromium required)",
			browserBackend: "Recognition backend: {backend}",
			privacyTitle: "Privacy",
			privacyDesc: "Audio goes straight to the browser speech service (Edge=Microsoft Azure, Chrome=Google) — never to any DSH server, never written to disk.",
			failure: "Recognition failed: {code}"
		};
		//#endregion
		//#region src/client/index.ts
		const name = "dsh-voice-webspeech-client";
		const inject = ["slots", "locale"];
		const LOCALE_NS = "voice.webspeech";
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(LOCALE_NS, {
				zh,
				en
			}), "dsh-voice-webspeech: dictionaries");
			ctx.effect(() => {
				return ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
					name: "conversation.input.left",
					id: "voice-webspeech-recorder",
					order: 10,
					locale: LOCALE_NS,
					inject: () => ({})
				}, RecorderButton));
			}, "dsh-voice-webspeech: recorder slot");
			ctx.effect(() => {
				return ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
					name: "settings.plugin.item",
					id: "voice-webspeech",
					order: 30,
					locale: LOCALE_NS,
					inject: () => ({})
				}, SettingsCard));
			}, "dsh-voice-webspeech: plugin config card");
		}
		//#endregion
		exports.LOCALE_NS = LOCALE_NS;
		exports.apply = apply;
		exports.inject = inject;
		exports.name = name;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map