import React from "react";
import { CKEditor, useCKEditorCloud } from "@ckeditor/ckeditor5-react";

type RichTextEditorProps = {
  value: string;
  onChange: (data: string) => void;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  loadingFallback = <div>Loading editor...</div>,
  errorFallback = <div>Unable to load editor.</div>,
}) => {
  const cloud = useCKEditorCloud({
    version: "47.3.0",
    translations: ["en"],
  });

  if (cloud.status === "error") {
    return <>{errorFallback}</>;
  }

  if (cloud.status === "loading") {
    return <>{loadingFallback}</>;
  }

  const {
			ClassicEditor,
			Autosave,
			Essentials,
			Paragraph,
			Autoformat,
			TextTransformation,
			LinkImage,
			Link,
			ImageBlock,
			ImageToolbar,
			BlockQuote,
			Bold,
			CKBox,
			CloudServices,
			ImageUpload,
			ImageInsert,
			ImageInsertViaUrl,
			AutoImage,
			PictureEditing,
			CKBoxImageEdit,
			TableColumnResize,
			Table,
			TableToolbar,
			Emoji,
			Mention,
			Heading,
			ImageTextAlternative,
			ImageCaption,
			ImageResize,
			ImageStyle,
			Indent,
			IndentBlock,
			ImageInline,
			Italic,
			ListProperties,
			List,
			MediaEmbed,
			PasteFromOffice,
			TableCaption,
			TableCellProperties,
			TableProperties,
			TodoList,
			Underline
		} = cloud.CKEditor;

  return (
    <CKEditor
      editor={ClassicEditor}
      config={{
                licenseKey:
          "eyJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NjY0NDc5OTksImp0aSI6IjIzODAxNGIxLTdlNjgtNDg2NS05ZGIzLTcyMmNlOTUxYjdlMSIsInVzYWdlRW5kcG9pbnQiOiJodHRwczovL3Byb3h5LWV2ZW50LmNrZWRpdG9yLmNvbSIsImRpc3RyaWJ1dGlvbkNoYW5uZWwiOlsiY2xvdWQiLCJkcnVwYWwiLCJzaCJdLCJ3aGl0ZUxhYmVsIjp0cnVlLCJsaWNlbnNlVHlwZSI6InRyaWFsIiwiZmVhdHVyZXMiOlsiKiJdLCJ2YyI6IjdlMTc5ZjI3In0.KpKopMN1AI9eDaw8zgAZraxPSn0EIUFv0dQR0Rcjf4WhXatqghpMmyK98sd6zoL5ZYCn9sN4Ue6hUkLKAJP7wA",
        plugins: [
					Autoformat,
					AutoImage,
					Autosave,
					BlockQuote,
					Bold,
					CKBox,
					CKBoxImageEdit,
					CloudServices,
					Emoji,
					Essentials,
					Heading,
					ImageBlock,
					ImageCaption,
					ImageInline,
					ImageInsert,
					ImageInsertViaUrl,
					ImageResize,
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
					ListProperties,
					MediaEmbed,
					Mention,
					Paragraph,
					PasteFromOffice,
					PictureEditing,
					Table,
					TableCaption,
					TableCellProperties,
					TableColumnResize,
					TableProperties,
					TableToolbar,
					TextTransformation,
					TodoList,
					Underline
				],
        toolbar: {
          items: [
						'undo',
						'redo',
						'|',
						'heading',
						'|',
						'bold',
						'italic',
						'underline',
						'|',
						'emoji',
						'link',
						'insertImage',
						'ckbox',
						'mediaEmbed',
						'insertTable',
						'blockQuote',
						'|',
						'bulletedList',
						'numberedList',
						'todoList',
						'outdent',
						'indent'
					],
					shouldNotGroupWhenFull: false
        },
        heading: {
          options: [
            { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
            { model: "heading1", view: "h1", title: "Heading 1", class: "ck-heading_heading1" },
            { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
            { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
            { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
            { model: "heading5", view: "h5", title: "Heading 5", class: "ck-heading_heading5" },
            { model: "heading6", view: "h6", title: "Heading 6", class: "ck-heading_heading6" },
          ],
        },
        fontSize: {
          options: [9, 11, 13, "default", 17, 19, 21, 27, 35],
          supportAllValues: true,
        },
        fontFamily: {
          options: [
            "default",
            "Arial, Helvetica, sans-serif",
            "Courier New, Courier, monospace",
            "Georgia, serif",
            "Lucida Sans Unicode, Lucida Grande, sans-serif",
            "Tahoma, Geneva, sans-serif",
            "Times New Roman, Times, serif",
            "Trebuchet MS, Helvetica, sans-serif",
            "Verdana, Geneva, sans-serif",
          ],
          supportAllValues: true,
        },
        image: {
          toolbar: [
            "imageTextAlternative",
            "toggleImageCaption",
            "|",
            "imageStyle:inline",
            "imageStyle:block",
            "imageStyle:side",
            "|",
            "resizeImage",
          ],
          insert: {
            type: "auto",
          },
        },
        table: {
          contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties",
          ],
        },
        link: {
          decorators: {
            openInNewTab: {
              mode: "manual",
              label: "Open in a new tab",
              attributes: {
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          },
        },
        mention: {
          feeds: [
            {
              marker: "@",
              feed: ["@Alice", "@Bob", "@Charlie", "@David", "@Emily"],
              minimumCharacters: 1,
            },
          ],
        },
        htmlSupport: {
          allow: [
            {
              name: /.*/,
              attributes: true,
              classes: true,
              styles: true,
            },
          ],
        },
      }}
      data={value}
      onChange={(event, editor) => {
        const data = editor.getData();
        onChange(data);
      }}
    />
  );
};

export default RichTextEditor;