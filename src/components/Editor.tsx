/**
 * This configuration was generated using the CKEditor 5 Builder. You can modify it anytime using this link:
 * https://ckeditor.com/ckeditor-5/builder/#installation/NoNgNARATAdAnDADBSBmALADneum7oCMImArHIkZgOypxR11SmogVRnmLVz0oQBTAHYpEYYITCSxk2QF1IAM0wCARulXI5QA
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { CKEditor, useCKEditorCloud } from '@ckeditor/ckeditor5-react';
import { showNotification } from "@/pages/HomePage/utils";

import '../App.css';

const LICENSE_KEY =
	'eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjY0NDc5OTksImp0aSI6IjIzODAxNGIxLTdlNjgtNDg2NS05ZGIzLTcyMmNlOTUxYjdlMSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6IjdlMTc5ZjI3In0.KpKopMN1AI9eDaw8zgAZraxPSn0EIUFv0dQR0Rcjf4WhXatqghpMmyK98sd6zoL5ZYCn9sN4Ue6hUkLKAJP7wA';

const CLOUD_SERVICES_TOKEN_URL =
	'https://qshkwqh64ctn.cke-cs.com/token/dev/5114abf756c3137eab2c000f7729ab62c05e9d20682e7a6d40bfe069742a?limit=10';

export default function App() {
	const editorContainerRef = useRef(null);
	const editorRef = useRef(null);
	const [isLayoutReady, setIsLayoutReady] = useState(false);
	const cloud = useCKEditorCloud({ version: '47.3.0', ckbox: { version: '2.9.2' } });

	useEffect(() => {
		setIsLayoutReady(true);

		return () => setIsLayoutReady(false);
	}, []);

	const { ClassicEditor, editorConfig } = useMemo<{
		ClassicEditor?: unknown;
		editorConfig?: Record<string, unknown>;
	}>(() => {
		if (cloud.status !== 'success' || !isLayoutReady) {
			return {};
		}

		const {
			ClassicEditor,
			Autosave,
			Essentials,
			Paragraph,
			LinkImage,
			Link,
			ImageBlock,
			ImageToolbar,
			BlockQuote,
			ImageInsertViaUrl,
			AutoImage,
			Table,
			TableToolbar,
			Heading,
			ImageTextAlternative,
			ImageCaption,
			ImageStyle,
			Indent,
			IndentBlock,
			ImageInline,
			List,
			TableCaption,
			TodoList,
			Bold,
			Italic,
			Underline,
			Strikethrough,
			Code,
			Subscript,
			Superscript,
			FontBackgroundColor,
			FontColor,
			FontFamily,
			FontSize,
			Highlight,
			HorizontalLine,
			Alignment,
			ImageUpload,
			CKBox,
			CloudServices,
			ImageInsert,
			PictureEditing,
			PlainTableOutput,
			BalloonToolbar
		} = cloud.CKEditor;

		return {
			ClassicEditor,
			editorConfig: {
				toolbar: {
					items: [
						'undo',
						'redo',
						'|',
						'heading',
						'|',
						'fontSize',
						'fontFamily',
						'fontColor',
						'fontBackgroundColor',
						'|',
						'bold',
						'italic',
						'underline',
						'strikethrough',
						'subscript',
						'superscript',
						'code',
						'|',
						'horizontalLine',
						'link',
						'insertImage',
						'insertImageViaUrl',
						'ckbox',
						'insertTable',
						'highlight',
						'blockQuote',
						'|',
						'alignment',
						'|',
						'bulletedList',
						'numberedList',
						'todoList',
						'outdent',
						'indent'
					],
					shouldNotGroupWhenFull: false
				},
				plugins: [
					Alignment,
					AutoImage,
					Autosave,
					BalloonToolbar,
					BlockQuote,
					Bold,
					CKBox,
					CloudServices,
					Code,
					Essentials,
					FontBackgroundColor,
					FontColor,
					FontFamily,
					FontSize,
					Heading,
					Highlight,
					HorizontalLine,
					ImageBlock,
					ImageCaption,
					ImageInline,
					ImageInsert,
					ImageInsertViaUrl,
					ImageStyle,
					ImageTextAlternative,
					ImageToolbar,
					ImageUpload,
					Indent,
					IndentBlock,
					Italic,
					Link,
					LinkImage,
					List,
					Paragraph,
					PictureEditing,
					PlainTableOutput,
					Strikethrough,
					Subscript,
					Superscript,
					Table,
					TableCaption,
					TableToolbar,
					TodoList,
					Underline
				],
				balloonToolbar: ['bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
				cloudServices: {
					tokenUrl: CLOUD_SERVICES_TOKEN_URL
				},
				fontFamily: {
					supportAllValues: true
				},
				fontSize: {
					options: [10, 12, 14, 'default', 18, 20, 22],
					supportAllValues: true
				},
				heading: {
					options: [
						{
							model: 'paragraph',
							title: 'Paragraph',
							class: 'ck-heading_paragraph'
						},
						{
							model: 'heading1',
							view: 'h1',
							title: 'Heading 1',
							class: 'ck-heading_heading1'
						},
						{
							model: 'heading2',
							view: 'h2',
							title: 'Heading 2',
							class: 'ck-heading_heading2'
						},
						{
							model: 'heading3',
							view: 'h3',
							title: 'Heading 3',
							class: 'ck-heading_heading3'
						},
						{
							model: 'heading4',
							view: 'h4',
							title: 'Heading 4',
							class: 'ck-heading_heading4'
						},
						{
							model: 'heading5',
							view: 'h5',
							title: 'Heading 5',
							class: 'ck-heading_heading5'
						},
						{
							model: 'heading6',
							view: 'h6',
							title: 'Heading 6',
							class: 'ck-heading_heading6'
						}
					]
				},
				image: {
					toolbar: ['toggleImageCaption', 'imageTextAlternative', '|', 'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText']
				},
				initialData:
					'<h2>Congratulations on setting up CKEditor 5! 🎉</h2>\n<p>\n\tYou\'ve successfully created a CKEditor 5 project. This powerful text editor\n\twill enhance your application, enabling rich text editing capabilities that\n\tare customizable and easy to use.\n</p>\n<h3>What\'s next?</h3>\n<ol>\n\t<li>\n\t\t<strong>Integrate into your app</strong>: time to bring the editing into\n\t\tyour application. Take the code you created and add to your application.\n\t</li>\n\t<li>\n\t\t<strong>Explore features:</strong> Experiment with different plugins and\n\t\ttoolbar options to discover what works best for your needs.\n\t</li>\n\t<li>\n\t\t<strong>Customize your editor:</strong> Tailor the editor\'s\n\t\tconfiguration to match your application\'s style and requirements. Or\n\t\teven write your plugin!\n\t</li>\n</ol>\n<p>\n\tKeep experimenting, and don\'t hesitate to push the boundaries of what you\n\tcan achieve with CKEditor 5. Your feedback is invaluable to us as we strive\n\tto improve and evolve. Happy editing!\n</p>\n<h3>Helpful resources</h3>\n<ul>\n\t<li>📝 <a href="https://portal.ckeditor.com/checkout?plan=free">Trial sign up</a>,</li>\n\t<li>📕 <a href="https://ckeditor.com/docs/ckeditor5/latest/installation/index.html">Documentation</a>,</li>\n\t<li>⭐️ <a href="https://github.com/ckeditor/ckeditor5">GitHub</a> (star us if you can!),</li>\n\t<li>🏠 <a href="https://ckeditor.com">CKEditor Homepage</a>,</li>\n\t<li>🧑‍💻 <a href="https://ckeditor.com/ckeditor-5/demo/">CKEditor 5 Demos</a>,</li>\n</ul>\n<h3>Need help?</h3>\n<p>\n\tSee this text, but the editor is not starting up? Check the browser\'s\n\tconsole for clues and guidance. It may be related to an incorrect license\n\tkey if you use premium features or another feature-related requirement. If\n\tyou cannot make it work, file a GitHub issue, and we will help as soon as\n\tpossible!\n</p>\n',
				licenseKey: LICENSE_KEY,
				link: {
					addTargetToExternalLinks: true,
					defaultProtocol: 'https://',
					decorators: {
						toggleDownloadable: {
							mode: 'manual',
							label: 'Downloadable',
							attributes: {
								download: 'file'
							}
						}
					}
				},
				menuBar: {
					isVisible: true
				},
				placeholder: 'Type or paste your content here!',
				table: {
					contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
				}
			}
		};
	}, [cloud, isLayoutReady]);

	useEffect(() => {
		if (editorConfig) {
			configUpdateAlert(editorConfig);
		}
	}, [editorConfig]);

	return (
		<div className="main-container">
			<div className="editor-container editor-container_classic-editor" ref={editorContainerRef}>
				<div className="editor-container__editor">
						<div ref={editorRef}>
							{Boolean(ClassicEditor) && editorConfig ? (
								<CKEditor editor={ClassicEditor as never} config={editorConfig as never} />
							) : null}
						</div>
					</div>
				</div>
			</div>
		);
	}

/**
 * This function exists to remind you to update the config needed for premium features.
 * The function can be safely removed. Make sure to also remove call to this function when doing so.
 */
type ConfigUpdateAlertFn = ((config: Record<string, unknown>) => void) & {
	configUpdateAlertShown?: boolean;
};

type EditorConfigCloudServices = {
	cloudServices?: {
		tokenUrl?: string;
	};
};

const configUpdateAlert: ConfigUpdateAlertFn = (config) => {
	if (configUpdateAlert.configUpdateAlertShown) {
		return;
	}

	const isModifiedByUser = (currentValue: unknown, forbiddenValue: string) => {
		if (currentValue === forbiddenValue) {
			return false;
		}

		if (currentValue === undefined) {
			return false;
		}

		return true;
	};

	const valuesToUpdate: string[] = [];

	configUpdateAlert.configUpdateAlertShown = true;

	const tokenUrl = (config as EditorConfigCloudServices).cloudServices?.tokenUrl;
	if (!isModifiedByUser(tokenUrl, '<YOUR_CLOUD_SERVICES_TOKEN_URL>')) {
		valuesToUpdate.push('CLOUD_SERVICES_TOKEN_URL');
	}

	if (valuesToUpdate.length) {
		showNotification(
			`Update editor config for premium features: ${valuesToUpdate.join(", ")}.`,
			"error",
			{ title: "Editor configuration", durationMs: 10000 }
		);
	}
};
