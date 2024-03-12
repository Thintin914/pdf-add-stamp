import { useEffect, useRef, useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

const options = {
  cMapUrl: '/cmaps/',
  standardFontDataUrl: '/standard_fonts/',
};

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>();

  const pdfDiv = useRef<HTMLDivElement | null>(null);
  const [pdfWidth, setPdfWidth] = useState<number>(0);

  function onDocumentLoadSuccess({ numPages: nextNumPages }: PDFDocumentProxy): void {
    setNumPages(nextNumPages);
  }

  const handleChange = (file: File) => {
    setFile(file);
    console.log(file);
  };

  useEffect(() =>{
    const onResize = () =>{
      if (!pdfDiv.current)
        return;

      setPdfWidth(pdfDiv.current.clientWidth);
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () =>{
      window.removeEventListener('resize', onResize);
    }
  }, [])

  return (
    <div className=" w-full h-screen flex justify-start items-start p-2">

      <div className=" w-[40vw] h-full">

      </div>

      <div ref={pdfDiv} className=" w-[60vw] h-full">
        <div className=" w-full h-full"
          style={{
            display: file ? 'none' : 'block'
          }}
        >
          <FileUploader
            handleChange={handleChange}
            name="file"
            types={["pdf"]}
            children={
              <div className=" w-full h-full border border-zinc-800 rounded-sm border-dashed cursor-pointer hover:border-zinc-400 hover:text-zinc-400 flex justify-center items-center">
                <p>Add PDF file here</p>
              </div>
            }
          />
        </div>
      </div>

      <div className=" w-full h-full border border-zinc-800"
        style={{
          display: file ? 'block' : 'none'
        }}
      >
          <Document file={file} onLoadSuccess={onDocumentLoadSuccess} options={options}>
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                renderAnnotationLayer={false}
                renderTextLayer={false}
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={pdfWidth}
              />
            ))}
          </Document>
      </div>

    </div>
  );
}
