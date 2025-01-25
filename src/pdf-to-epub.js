const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class PdfToEpubConverter {
  static async converterPdfParaEpub(pdfPath, epubPath) {
    pdfPath = path.join(__dirname, pdfPath);
    console.log(`Convertendo PDF para EPUB: ${pdfPath} -> ${epubPath}`);

    if (!fs.existsSync(pdfPath)) {
      console.error(`Arquivo PDF ${pdfPath} não encontrado.`);
      return;
    }

    const outputDir = path.dirname(epubPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Comando com ajustes para ocupação total no Kindle
    const comando = `
      ebook-convert "${pdfPath}" "${epubPath}" 
      --output-profile=kindle 
      --margin-top=0 
      --margin-bottom=0 
      --margin-left=0 
      --margin-right=0 
      --enable-heuristics 
      --disable-font-rescaling
    `.replace(/\s+/g, ' '); // Remove quebras de linha desnecessárias

    console.log(`Iniciando a conversão de PDF para EPUB com comando: ${comando}`);

   await new Promise((resolve, reject)=>{

    exec(comando, (error, stdout, stderr) => {
        if (error) {
          console.error(`Erro ao converter PDF para EPUB: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Erro ao converter PDF para EPUB (stderr): ${stderr}`);
          return reject(stderr);
        }

        return resolve(stdout);
        console.log(`Conversão bem-sucedida! O arquivo EPUB foi gerado em: ${epubPath}`);
      });
   }) 
  }
}

module.exports = { PdfToEpubConverter };
