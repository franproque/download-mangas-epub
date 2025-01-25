const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit'); // Importa a biblioteca pdfkit

class PDFGenerator {
  static async gerarPdfComImagens(nomePasta, nomeArquivoPdf) {
    const pastaImagens = path.join(__dirname, nomePasta); // Caminho da pasta de imagens
    const pastaDestino = path.join(__dirname, 'images'); // Pasta onde as imagens serão copiadas

    // Verifica se a pasta de imagens existe
    if (!fs.existsSync(pastaImagens)) {
      console.error(`Pasta ${nomePasta} não encontrada`);
      return;
    }

    // Verifica se a pasta de imagens existe, caso contrário cria ela
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino, { recursive: true });
    }

    const dirs = fs.readdirSync(pastaImagens); // Lê os arquivos da pasta de imagens
    
    // Ordena os arquivos de imagens por nome (você pode adicionar uma lógica personalizada de ordenação, caso necessário)
    let sortedDirs = dirs // Ordena os nomes dos arquivos em ordem alfabética
    //Filtrar apenas arquivos .jpeg
    .filter((dir) => dir.endsWith('.png'))
    let newArray = [];
    for(  let i = 1; i < sortedDirs.length; i++){
        newArray.push(`pagina_${i}_final_canvas.png`);
    }

    sortedDirs=newArray;
    const pdfDoc = new PDFDocument(); // Cria uma instância do PDFDocument

    const outputFilePath = path.join(__dirname, nomeArquivoPdf);
    const writeStream = fs.createWriteStream(outputFilePath); // Cria o stream de escrita para o arquivo PDF
    pdfDoc.pipe(writeStream); // Liga o stream ao PDF

    console.log(`Pasta ${nomePasta} possui ${sortedDirs.length} imagens`);

    // Para cada imagem na pasta, vamos adicioná-la ao PDF
    for (let dir of sortedDirs) {
      const dirPath = path.join(pastaImagens, dir);

      if (dir.endsWith('.png') || dir.endsWith('.jpg') || dir.endsWith('.jpeg') || dir.endsWith('.webp')) {
        const destFilePath = path.join(pastaDestino, dir);

        // Copiar a imagem para a pasta 'images/'
        fs.copyFileSync(dirPath, destFilePath);
        console.log(`Imagem ${dirPath} copiada para ${destFilePath}`);

        // Adicionar a imagem ao PDF
        const img = fs.readFileSync(destFilePath); // Lê a imagem como buffer
        const { width, height } = pdfDoc.page; // Obtém as dimensões da página do PDF
        // Ajusta a imagem para que ocupe toda a página
        pdfDoc.addPage({ size: [width, height] });
        pdfDoc.image(img, 0, 0, { width: width, height: height });
      }
    }

    // Finaliza o PDF
    pdfDoc.end();
    writeStream.on('finish', () => {
      console.log(`PDF gerado com sucesso: ${nomeArquivoPdf}`);
    });

    writeStream.on('error', (error) => {
      console.error("Erro ao gerar o PDF:", error.message);
    });
  }
}

module.exports = { PDFGenerator };
