import { PDFDocument, PDFImage, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { useEffect, useRef, useState } from "react";
import { FileUploader } from "react-drag-drop-files";

function hexToRgb(hex: string) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
}

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [pageSize, setPageSize] = useState<{width: number, height: number}>({width: 0, height: 0});
  const [totalPages, setTotalPages] = useState<number>(0);

  const handleChange = async(file: File) => {
    setFile(file);
    let array_buffer = await file.arrayBuffer();
    pdfDoc.current = await PDFDocument.load(array_buffer);
    allPages.current = pdfDoc.current.getPages();
    setPageSize(allPages.current[0].getSize())
    setTotalPages(allPages.current.length);
  };

  const pdfDoc = useRef<PDFDocument | null>(null);
  const allPages = useRef<PDFPage[]>([])
  const padding = 5;

  async function createPDFFile(){
    if (!file)
      return;
    if (!pdfDoc.current)
      return;

    let array_buffer = await file.arrayBuffer();
    pdfDoc.current = await PDFDocument.load(array_buffer);
    allPages.current = pdfDoc.current.getPages();
    setPageSize(allPages.current[0].getSize())
    setTotalPages(allPages.current.length);
    const timesRomanFont = await pdfDoc.current.embedFont(StandardFonts.TimesRomanItalic)

    for(let i = 0; i < textCards.length; i++){
      let card = textCards[i];
      let textWidth = card.fontSize * card.text.length;
      let x = 0;
      if (card.x === 'left')
        x = 0 + padding;
      else if (card.x === 'middle')
        x = (pageSize.width * 0.5) - (textWidth * 0.25);
      else if (card.x === 'right')
        x = pageSize.width - (textWidth * 0.5) - padding;

      let y = 0;
      if (card.y === 'above')
        y = pageSize.height - padding - card.fontSize;
      else if (card.y === 'below')
        y = 0 + padding;

      let color = hexToRgb(card.hexColor);
      let r = 0;
      let g = 0;
      let b = 0;
      if (color){
        r = color.r;
        g = color.g;
        b = color.b;
      }

      if (card.page === 'All'){
        for(let i = 0; i < allPages.current.length; i++){
          let current_page = allPages.current[i];

          current_page.drawText(card.text, {
            x: x,
            y: y,
            size: card.fontSize,
            font: timesRomanFont,
            color: rgb(r, g, b),
          })
        }
      } else {
        let pages = card.page.split(',');
        for(let i = 0; i < pages.length; i++){
          let page_index = parseInt(pages[i].trim());
          if (isNaN(page_index)){
            alert(`Invalid Input: ${card.page}`);
            break;
          }
          page_index -= 1;
          if (page_index < 0 || allPages.current.length <= page_index){
            alert(`PDF File Length Invalid: ${card.page}`);
            break;
          }

          let current_page = allPages.current[page_index];

          current_page.drawText(card.text, {
            x: x,
            y: y,
            size: card.fontSize,
            font: timesRomanFont,
            color: rgb(r, g, b),
          })
        }
      }
    }

    for(let i = 0; i < imageCards.length; i++){
      let card = imageCards[i];
      if (!card.image)
        continue;

      let filetype = card.image.type;
      let array_buffer = await card.image.arrayBuffer();
      let pdfImage: PDFImage | null = null;
      if (filetype === 'image/jpeg'){
        pdfImage = await pdfDoc.current.embedJpg(array_buffer);
      } else if (filetype === 'image/png'){
        pdfImage = await pdfDoc.current.embedPng(array_buffer);
      }
      if (!pdfImage)
        continue;

      let imageSize = pdfImage.scale(card.scale);

      let x = 0;
      if (card.x === 'left')
        x = 0 + padding;
      else if (card.x === 'middle')
        x = (pageSize.width * 0.5) - (imageSize.width * 0.5);
      else if (card.x === 'right')
        x = pageSize.width - imageSize.width - padding;

      let y = 0;
      if (card.y === 'above')
        y = pageSize.height - padding - imageSize.height;
      else if (card.y === 'below')
        y = 0 + padding;

      if (card.page === 'All'){
        for(let i = 0; i < allPages.current.length; i++){
          let current_page = allPages.current[i];
          current_page.drawImage(pdfImage, {
            x: x,
            y: y,
            width: imageSize.width,
            height: imageSize.height,
          })
        }
      } else {
        let pages = card.page.split(',');
        for(let i = 0; i < pages.length; i++){
          let page_index = parseInt(pages[i].trim());
          if (isNaN(page_index)){
            alert(`Invalid Input: ${card.page}`);
            break;
          }
          page_index -= 1;
          if (page_index < 0 || allPages.current.length <= page_index){
            alert(`PDF File Length Invalid: ${card.page}`);
            break;
          }

          let current_page = allPages.current[page_index];

          current_page.drawImage(pdfImage, {
            x: x,
            y: y,
            width: imageSize.width,
            height: imageSize.height,
          })
        }
      }
    }

    const pdfBytes = await pdfDoc.current.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url);
    URL.revokeObjectURL(url);
  }

  const addImageFile = (file: File, index: number) => {
    let temp = imageCards;
    if (temp[index].source){
      URL.revokeObjectURL(temp[index].source);
    }
    temp[index].source = URL.createObjectURL(file);
    temp[index].image = file;
    setImageCards([...temp]);
  }

  const [textCards, setTextCards] = useState<{x: string, y: string, page: string, text: string, fontSize: number, hexColor: string}[]>([]);
  const [imageCards, setImageCards] = useState<{x: string, y: string, page: string, image: File | null, source: string, scale: number}[]>([]);

  return (
    <div className=" w-full h-screen flex flex-col md:flex-row justify-start items-start p-2">

      <div className=" w-full md:w-[40vw] h-full flex flex-col justify-start items-start p-1 border border-zinc-400 overflow-y-scroll">

        <div className=" w-full select-none p-1 bg-zinc-800 text-white font-semibold inline-flex justify-center hover:opacity-80 cursor-pointer"
          onClick={() =>{
            setTextCards([
              ... textCards,
              {
                x: 'left',
                y: 'above',
                page: 'All',
                text: '',
                fontSize: 20,
                hexColor: '#000000'
              }
            ])
          }}
        >
          <p>Add Text</p>
        </div>

        {
          textCards.map((textCard, index) =>{
            return (
              <div key={`card-text-${index}`} className=" w-full mb-2 p-1 border border-zinc-800 flex flex-col justify-start items-start">

                <div className=" p-1 bg-zinc-800 text-white text-sm select-none cursor-pointer hover:opacity-80"
                  onClick={() =>{
                    let temp = textCards;
                    temp.splice(index, 1);
                    setTextCards([...temp]);
                  }}
                >
                  <p>Delete</p>
                </div>

                <p className=" font-semibold">Position X:</p>
                <select value={textCard.x} className=" w-full border border-zinc-800 p-1"
                  onChange={(e) =>{
                    let temp = textCards;
                    temp[index].x = e.target.value;
                    setTextCards([...temp]);
                  }}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="middle">Middle</option>
                </select>
                <p className=" font-semibold">Position Y:</p>
                <select value={textCard.y} className=" w-full border border-zinc-800 p-1"
                  onChange={(e) =>{
                    let temp = textCards;
                    temp[index].y = e.target.value;
                    setTextCards([...temp]);
                  }}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <p className=" font-semibold">Pages:</p>
                <input value={textCard.page} className=" w-full border border-zinc-800 p-1" placeholder='"All", "1, 2, 3, ..."' 
                  onChange={(e) =>{
                    let temp = textCards;
                    temp[index].page = e.target.value;
                    setTextCards([...temp]);
                  }}
                />
                <p className=" font-semibold">Font Size:</p>
                <input value={textCard.fontSize} className=" w-full border border-zinc-800 p-1" 
                  onChange={(e) =>{
                    let val = parseInt(e.target.value);
                    if (isNaN(val))
                      val = 20;
                    let temp = textCards;
                    temp[index].fontSize = val;
                    setTextCards([...temp]);
                  }}
                />
                <p className=" font-semibold">Hex Color Code:</p>
                <input value={textCard.hexColor} className=" w-full border border-zinc-800 p-1" 
                  onChange={(e) =>{
                    let temp = textCards;
                    temp[index].hexColor = e.target.value;
                    setTextCards([...temp]);
                  }}
                />
                <p className=" font-semibold">Enter Text:</p>
                <textarea value={textCard.text} className=" w-full min-h-5 border border-zinc-800 p-1" 
                  onChange={(e) =>{
                    let temp = textCards;
                    temp[index].text = e.target.value;
                    setTextCards([...temp]);
                  }}
                />
              </div>
            )
          })
        }

      </div>

      <div className=" w-full md:w-[40vw] h-full flex flex-col justify-start items-start p-1 border border-zinc-400 overflow-y-scroll">

        <div className=" w-full select-none p-1 bg-zinc-800 text-white font-semibold inline-flex justify-center hover:opacity-80 cursor-pointer"
          onClick={() =>{
            setImageCards([
              ... imageCards,
              {
                x: 'left',
                y: 'above',
                page: 'All',
                image: null,
                source: '',
                scale: 0.5
              }
            ])
          }}
        >
          <p>Add Image</p>
        </div>

        {
          imageCards.map((imageCard, index) =>{
            return (
              <div key={`card-img-${index}`} className=" w-full mb-2 p-1 border border-zinc-800 flex flex-col justify-start items-start">
                
                <div className=" p-1 bg-zinc-800 text-white text-sm select-none cursor-pointer hover:opacity-80"
                  onClick={() =>{
                    let temp = imageCards;
                    temp.splice(index, 1);
                    setImageCards([...temp]);
                  }}
                >
                  <p>Delete</p>
                </div>
                
                <p className=" font-semibold">Position X:</p>
                <select value={imageCard.x} className=" w-full border border-zinc-800 p-1"
                  onChange={(e) =>{
                    let temp = imageCards;
                    temp[index].x = e.target.value;
                    setImageCards([...temp]);
                  }}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="middle">Middle</option>
                </select>
                <p className=" font-semibold">Position Y:</p>
                <select value={imageCard.y} className=" w-full border border-zinc-800 p-1"
                  onChange={(e) =>{
                    let temp = imageCards;
                    temp[index].y = e.target.value;
                    setImageCards([...temp]);
                  }}
                >
                  <option value="above">Above</option>
                  <option value="below">Below</option>
                </select>
                <p className=" font-semibold">Pages:</p>
                <input value={imageCard.page} className=" w-full border border-zinc-800 p-1" placeholder='"All", "1, 2, 3, ..."' 
                  onChange={(e) =>{
                    let temp = imageCards;
                    temp[index].page = e.target.value;
                    setImageCards([...temp]);
                  }}
                />
                <p className=" font-semibold">Scale:</p>
                <input value={imageCard.scale} className=" w-full border border-zinc-800 p-1" 
                  onChange={(e) =>{
                    let val = parseFloat(e.target.value);
                    if (isNaN(val))
                      val = 0.5;
                    let temp = imageCards;
                    temp[index].scale = val;
                    setImageCards([...temp]);
                  }}
                />
                <p className=" font-semibold">Upload Image:</p>
                <div className=" w-full mb-1">
                  <FileUploader
                    handleChange={(file: File) => addImageFile(file, index)}
                    name="file"
                    types={['png', 'jpg', 'jpeg']}
                    children={
                      <div className=" w-full h-full border border-zinc-800 rounded-sm border-dashed cursor-pointer hover:border-zinc-400 hover:text-zinc-400 flex justify-center items-center">
                        <p>Add .png, .jpg, .jpeg file here</p>
                      </div>
                    }
                  />
                </div>

                {
                  imageCard.source ?
                  <div className=" w-1/2">
                    <img src={imageCard.source} className=" w-full h-full object-contain" />
                  </div> : <></>
                }
              </div>
            )
          })
        }

      </div>

      <div className=" w-full md:w-[20vw] h-full flex flex-col">
        <div className=" w-full h-[80%]">
          <FileUploader
            handleChange={handleChange}
            name="file"
            types={["pdf"]}
            children={
              <div className=" w-full h-full border border-zinc-800 rounded-sm border-dashed cursor-pointer hover:border-zinc-400 hover:text-zinc-400 flex justify-center items-center">
                <p>{file ? file.name : 'Upload PDF File Here'}</p>
              </div>
            }
          />
        </div>

        <div className=" w-full h-[20%] bg-zinc-800 text-white inline-flex justify-center items-center font-semibold select-none cursor-pointer hover:opacity-80"
          onClick={() =>{
            if (!file)
              return;
            createPDFFile();
          }}
        >
          {
            file ?
            <div className=" w-full flex flex-col justify-center items-center">
              <p>{`${pageSize.width} x ${pageSize.height} px`}</p>
              <p>{`${totalPages} pages`}</p>
            </div> :
            <p>Upload PDF File First</p>
          }
        </div>

      </div>

    </div>
  );
}
